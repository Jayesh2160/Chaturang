package com.chaturang.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class ChaturangException extends RuntimeException {
    public ChaturangException(String message) {
        super(message);
    }

    public ChaturangException(String message, Throwable cause) {
        super(message, cause);
    }
}
