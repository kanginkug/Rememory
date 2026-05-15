package com.rememory.memory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Valid
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
