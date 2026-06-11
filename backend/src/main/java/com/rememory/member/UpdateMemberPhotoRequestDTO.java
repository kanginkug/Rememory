package com.rememory.member;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UpdateMemberPhotoRequestDTO {
    @NotBlank
    private String imageUrl;
}
