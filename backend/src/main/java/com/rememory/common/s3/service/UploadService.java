package com.rememory.common.s3.service;

import com.rememory.common.s3.PresignedUrlResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class UploadService {
    private final S3Presigner s3Presigner;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;
    @Value("${cloud.aws.region.static}")
    private String region;
    private final S3Client s3Client;

    /** S3 Presigned URL 일괄 생성 */
    public List<PresignedUrlResponseDTO> generatePresignedUrls(String folder, int count) {
        return IntStream.range(0, count)
                .mapToObj(i -> generate(folder))
                .toList();
    }

    /** S3 Presigned PUT URL 단건 생성, imageUrl(최종 접근 URL)과 함께 반환 */
    private PresignedUrlResponseDTO generate(String folder) {
        String key = folder + "/" + UUID.randomUUID();

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(r -> r
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(putRequest));

        String imageUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;

        return new PresignedUrlResponseDTO(presigned.url().toString(), imageUrl);
    }

    /** S3 객체 삭제 (imageUrl에서 key 추출) */
    public void delete(String imageUrl) {
        String key = imageUrl.substring(imageUrl.indexOf(".amazonaws.com/") + ".amazonaws.com/".length());

        s3Client.deleteObject(r -> r
                .bucket(bucket)
                .key(key));
    }

    /** S3 객체 일괄 삭제 */
    public void deleteAll(List<String> imageUrls) {
        imageUrls.forEach(this::delete);
    }
}
