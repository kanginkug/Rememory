package com.rememory.common.s3;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class PresignedUrlRequestDTO {
    @NotBlank
    private String folder; // "memory", "place", "profile" 등

    @Min(1) @Max(5)
    private int count;
}
