package com.chaturang.service;

import com.chaturang.dto.AuthResponse;
import com.chaturang.dto.LoginRequest;
import com.chaturang.dto.SignUpRequest;

public interface AuthService {
    AuthResponse register(SignUpRequest signUpRequest);
    AuthResponse login(LoginRequest loginRequest);
}
