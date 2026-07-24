package com.chaturang.controller;

import com.chaturang.dto.BestMoveRequest;
import com.chaturang.dto.BestMoveResponse;
import com.chaturang.dto.EvaluationRequest;
import com.chaturang.dto.EvaluationResponse;
import com.chaturang.service.StockfishService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/engine")
public class EngineController {

    private final StockfishService stockfishService;

    public EngineController(StockfishService stockfishService) {
        this.stockfishService = stockfishService;
    }

    @PostMapping("/best-move")
    public ResponseEntity<BestMoveResponse> getBestMove(@Valid @RequestBody BestMoveRequest request) {
        String bestMove = stockfishService.getBestMove(request.getFen(), request.getDifficulty());
        return ResponseEntity.ok(BestMoveResponse.builder().bestMove(bestMove).build());
    }

    @PostMapping("/evaluate")
    public ResponseEntity<EvaluationResponse> evaluate(@Valid @RequestBody EvaluationRequest request) {
        EvaluationResponse evaluation = stockfishService.evaluate(request.getFen());
        return ResponseEntity.ok(evaluation);
    }
}
