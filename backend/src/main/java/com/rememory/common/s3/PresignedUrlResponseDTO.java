package com.rememory.common.s3;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter@AllArgsConstructor
public class PresignedUrlResponseDTO {

    private String presignedUrl; // S3에 PUT할 임시 URL
    private String imageUrl;     // 업로드 후 실제 접근 URL
}
