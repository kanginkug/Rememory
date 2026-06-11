package com.rememory.member;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UpdateMemberRequestDTO {
    @NotBlank
    private String name;
}
