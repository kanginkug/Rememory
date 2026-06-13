package com.rememory.common.s3.controller;

import com.rememory.common.s3.PresignedUrlRequestDTO;
import com.rememory.common.s3.PresignedUrlResponseDTO;
import com.rememory.common.s3.service.UploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {
        private final UploadService uploadService;

        /** POST /api/upload/presigned-urls - S3 Presigned URL 목록 생성 */
        @PostMapping("/presigned-urls")
        public ResponseEntity<List<PresignedUrlResponseDTO>> getPresignedUrls(@RequestBody @Valid PresignedUrlRequestDTO requestDTO) {
            return ResponseEntity.ok(uploadService.generatePresignedUrls(requestDTO.getFolder(), requestDTO.getCount()));
        }

}
