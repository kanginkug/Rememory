package com.rememory.memory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class CreateMemoryRequestDTO {

    @NotBlank
    private String memoryName;

    @NotBlank
    @Size(max = 500)
    private String description;

    @Min(0)
    private int invitedCnt;

    private String photoUrl;

    private LocalDate startDate;

    private LocalDate endDate;
}
