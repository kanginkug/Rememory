package com.rememory.memory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Valid
@Getter
@AllArgsConstructor
public class CreateMemoryRequestDTO {

    @NotBlank
    private String memoryName;

    @NotBlank
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;
}
