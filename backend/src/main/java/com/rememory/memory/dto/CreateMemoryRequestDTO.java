package com.rememory.memory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class CreateMemoryRequestDTO {

    @NotBlank
    private String memoryName;

    @NotBlank
    private String description;

    private int invitedCnt;

    private String photoUrl;

    private LocalDate startDate;

    private LocalDate endDate;
}
