package com.rememory.memory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemoryPhotoRequestDTO {
    @NotBlank
    private String imageUrl;
}
