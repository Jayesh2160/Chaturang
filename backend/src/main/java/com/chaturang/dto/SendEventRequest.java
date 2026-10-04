package com.chaturang.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendEventRequest {
    @NotBlank(message = "Event type cannot be blank")
    private String type;

    private String senderId;
    private String senderName;
    private Object payload;
}
