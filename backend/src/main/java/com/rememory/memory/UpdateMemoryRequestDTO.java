package com.rememory.memory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Valid
@Getter
@AllArgsConstructor
public class UpdateMemoryRequestDTO {

    @NotNull
    private Long memoryId;

    @NotBlank
    private String memoryName;

    @NotBlank
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean showHistoryToNew;
}
