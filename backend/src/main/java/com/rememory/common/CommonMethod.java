package com.rememory.common;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
public class CommonMethod {
    // 프로필 이미지 저장 디렉터리 경로
    @Value("${upload.profile-dir:uploads/profile}")
    private String profileUploadDir;

    /**
     * MIME 타입 검증 후 UUID 파일명 리턴
     * MIME 타입 기반 검증만 수행하며 Magic Bytes 검증은 미구현 (TODO S8)
     */
    public String madePhotoUrl(MultipartFile file) {

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }

        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String savedFileName = UUID.randomUUID() + (ext != null ? "." + ext : "");
        Path savePath = Paths.get(profileUploadDir, savedFileName).toAbsolutePath();

        try {
            Files.createDirectories(savePath.getParent());
            Files.copy(file.getInputStream(), savePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return "/uploads/profile/" + savedFileName;
    }
}
