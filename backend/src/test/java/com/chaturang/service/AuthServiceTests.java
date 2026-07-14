package com.chaturang.service;

import com.chaturang.dto.AuthResponse;
import com.chaturang.dto.LoginRequest;
import com.chaturang.dto.SignUpRequest;
import com.chaturang.entity.User;
import com.chaturang.exception.BadRequestException;
import com.chaturang.exception.ResourceConflictException;
import com.chaturang.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthServiceTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void registerUser_Success() {
        SignUpRequest request = new SignUpRequest("chess_master", "master@chaturang.com", "secure123", 1600);
        
        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("chess_master", response.getUsername());
        assertEquals("master@chaturang.com", response.getEmail());
        assertEquals(1600, response.getRating());

        // Verify stored password is encrypted
        Optional<User> storedUserOpt = userRepository.findByUsername("chess_master");
        assertTrue(storedUserOpt.isPresent());
        User storedUser = storedUserOpt.get();
        assertTrue(passwordEncoder.matches("secure123", storedUser.getPasswordHash()));
    }

    @Test
    void registerUser_UsernameConflict() {
        SignUpRequest request1 = new SignUpRequest("duplicate_user", "user1@chaturang.com", "pass123", 1200);
        authService.register(request1);

        SignUpRequest request2 = new SignUpRequest("duplicate_user", "user2@chaturang.com", "pass456", 1300);

        assertThrows(ResourceConflictException.class, () -> authService.register(request2));
    }

    @Test
    void registerUser_EmailConflict() {
        SignUpRequest request1 = new SignUpRequest("user_one", "shared@chaturang.com", "pass123", 1200);
        authService.register(request1);

        SignUpRequest request2 = new SignUpRequest("user_two", "shared@chaturang.com", "pass456", 1300);

        assertThrows(ResourceConflictException.class, () -> authService.register(request2));
    }

    @Test
    void loginUser_Success() {
        // First register
        SignUpRequest registerRequest = new SignUpRequest("player1", "player1@chaturang.com", "secretPassword", 1400);
        authService.register(registerRequest);

        // Login using username
        LoginRequest loginRequest = new LoginRequest("player1", "secretPassword");
        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("player1", response.getUsername());
        assertEquals(1400, response.getRating());

        // Login using email
        LoginRequest loginEmailRequest = new LoginRequest("player1@chaturang.com", "secretPassword");
        AuthResponse response2 = authService.login(loginEmailRequest);

        assertNotNull(response2);
        assertNotNull(response2.getToken());
    }

    @Test
    void loginUser_Failure_InvalidPassword() {
        SignUpRequest registerRequest = new SignUpRequest("player2", "player2@chaturang.com", "secretPassword", 1400);
        authService.register(registerRequest);

        LoginRequest loginRequest = new LoginRequest("player2", "wrongPassword");

        assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
    }
}
