package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoveRequest {
    private String san;
    private String from;
    private String to;
    private String color; // "w" or "b"
    private String piece;
    private String promotion; // e.g. "q", "r", "b", "n" or null
}
