package com.chaturang.service;

import com.chaturang.dto.EvaluationResponse;
import com.chaturang.entity.EngineDifficulty;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Paths;

@Service
public class StockfishServiceImpl implements StockfishService {

    private static final Logger log = LoggerFactory.getLogger(StockfishServiceImpl.class);

    @Value("${STOCKFISH_PATH:${stockfish.path:bin/stockfish.exe}}")
    private String stockfishPath;

    // Persistent process fields
    private Process process;
    private BufferedReader reader;
    private BufferedWriter writer;

    private synchronized void ensureProcessRunning() {
        if (process == null || !process.isAlive()) {
            startProcess();
        }
    }

    private void startProcess() {
        String path = getAbsoluteStockfishPath();
        log.info("Starting long-lived Stockfish process from: {}", path);
        
        ProcessBuilder pb = new ProcessBuilder(path);
        try {
            process = pb.start();
            reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));

            // Initialize UCI
            writeCommand("uci");
            expectToken("uciok");
        } catch (IOException e) {
            log.error("Failed to start Stockfish process", e);
            stopProcess();
            throw new RuntimeException("Failed to start Stockfish process", e);
        }
    }

    private void stopProcess() {
        log.info("Stopping Stockfish process");
        if (process != null) {
            try {
                if (writer != null) {
                    writer.write("quit");
                    writer.newLine();
                    writer.flush();
                }
            } catch (Exception e) {
                // Ignore exit signal error
            }
            process.destroyForcibly();
            process = null;
        }
        try {
            if (reader != null) reader.close();
        } catch (Exception e) {}
        try {
            if (writer != null) writer.close();
        } catch (Exception e) {}
        reader = null;
        writer = null;
    }

    @PreDestroy
    public synchronized void shutdown() {
        stopProcess();
    }

    @Override
    public synchronized String getBestMove(String fen, EngineDifficulty difficulty) {
        int skillLevel = 10;
        int depth = 6;
        int movetime = 300;

        if (difficulty == EngineDifficulty.EASY) {
            skillLevel = 0;
            depth = 2;
            movetime = 100;
        } else if (difficulty == EngineDifficulty.MEDIUM) {
            skillLevel = 10;
            depth = 6;
            movetime = 300;
        } else if (difficulty == EngineDifficulty.HARD) {
            skillLevel = 20;
            depth = 12;
            movetime = 1000;
        }

        ensureProcessRunning();
        try {
            // Set options (Skill Level)
            writeCommand("setoption name Skill Level value " + skillLevel);

            // Set position
            writeCommand("position fen " + fen);

            // Start search
            writeCommand("go depth " + depth + " movetime " + movetime);

            // Read output until we see "bestmove"
            String line;
            while ((line = reader.readLine()) != null) {
                log.debug("Stockfish stdout: {}", line);
                if (line.startsWith("bestmove")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 2) {
                        return parts[1];
                    }
                    break;
                }
            }
        } catch (IOException e) {
            log.error("IO Error communicating with Stockfish, restarting engine...", e);
            stopProcess();
            throw new RuntimeException("Failed to calculate best move", e);
        }
        throw new RuntimeException("Stockfish did not return a valid bestmove");
    }

    @Override
    public synchronized EvaluationResponse evaluate(String fen) {
        // Detect if Black is the active player to move
        boolean isBlackToMove = false;
        try {
            String[] parts = fen.split("\\s+");
            if (parts.length > 1) {
                isBlackToMove = "b".equals(parts[1]);
            }
        } catch (Exception e) {
            log.warn("Could not determine turn from FEN, defaulting to White: {}", fen);
        }

        ensureProcessRunning();
        try {
            // Set position
            writeCommand("position fen " + fen);

            // Start search for evaluation (depth 10 is fast and accurate enough)
            writeCommand("go depth 10");

            String line;
            String lastScore = "0.00";
            String lastPv = "";
            String bestMove = null;
            while ((line = reader.readLine()) != null) {
                log.debug("Stockfish stdout: {}", line);
                if (line.startsWith("info") && line.contains("score")) {
                    String parsed = parseScore(line, isBlackToMove);
                    if (parsed != null) {
                        lastScore = parsed;
                    }
                    String pv = parsePv(line);
                    if (!pv.isEmpty()) {
                        lastPv = pv;
                    }
                }
                if (line.startsWith("bestmove")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 2) {
                        bestMove = parts[1];
                    }
                    break;
                }
            }
            return EvaluationResponse.builder()
                    .evaluation(lastScore)
                    .principalVariation(lastPv)
                    .bestMove(bestMove)
                    .build();
        } catch (IOException e) {
            log.error("IO Error communicating with Stockfish for evaluation, restarting engine...", e);
            stopProcess();
            throw new RuntimeException("Failed to evaluate position", e);
        }
    }

    private String getAbsoluteStockfishPath() {
        File file = new File(stockfishPath);
        if (!file.isAbsolute()) {
            file = Paths.get("").toAbsolutePath().resolve(stockfishPath).toFile();
        }
        if (!file.exists()) {
            String errorMsg = "Stockfish binary path does not exist. Please configure it in application.properties at: " + file.getAbsolutePath();
            log.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }
        return file.getAbsolutePath();
    }

    private void writeCommand(String command) throws IOException {
        log.debug("Stockfish stdin: {}", command);
        writer.write(command);
        writer.newLine();
        writer.flush();
    }

    private void expectToken(String expectedToken) throws IOException {
        String line;
        while ((line = reader.readLine()) != null) {
            log.debug("Stockfish stdout: {}", line);
            if (line.contains(expectedToken)) {
                return;
            }
        }
        throw new IOException("Did not receive expected token: " + expectedToken);
    }

    private String parseScore(String infoLine, boolean isBlackToMove) {
        String[] tokens = infoLine.split("\\s+");
        for (int i = 0; i < tokens.length; i++) {
            if ("score".equals(tokens[i]) && i + 2 < tokens.length) {
                String type = tokens[i + 1]; // "cp" or "mate"
                String valueStr = tokens[i + 2];
                try {
                    int value = Integer.parseInt(valueStr);
                    
                    // Normalize perspective to White's perspective
                    if (isBlackToMove) {
                        value = -value;
                    }

                    if ("cp".equals(type)) {
                        double pawns = value / 100.0;
                        return String.format(pawns >= 0 ? "+%.2f" : "%.2f", pawns);
                    } else if ("mate".equals(type)) {
                        return (value >= 0 ? "+" : "-") + "Mate in " + Math.abs(value);
                    }
                } catch (NumberFormatException e) {
                    // Ignore parsing error and continue
                }
            }
        }
        return null;
    }

    private String parsePv(String infoLine) {
        String[] tokens = infoLine.split("\\s+");
        StringBuilder pvBuilder = new StringBuilder();
        boolean foundPv = false;
        for (String token : tokens) {
            if (foundPv) {
                pvBuilder.append(token).append(" ");
            } else if ("pv".equals(token)) {
                foundPv = true;
            }
        }
        return pvBuilder.toString().trim();
    }
}
