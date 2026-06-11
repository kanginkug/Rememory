package com.rememory.memory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Valid
@Getter
@AllArgsConstructor
public class UpdateMemoryRequestDTO {

    @NotBlank
    @Size(max = 30)
    private String memoryName;

    @NotBlank
    @Size(max = 500)
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean showHistoryToNew;
}
