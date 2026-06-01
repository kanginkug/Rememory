package com.rememory.memory;

import com.rememory.memory.dto.CreateMemoryRequestDTO;
import com.rememory.memory.dto.MemoryDetailResponseDTO;
import com.rememory.memory.dto.MemoryListResponseDTO;
import com.rememory.memory.dto.UpdateMemoryRequestDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/memory")
@RequiredArgsConstructor
public class MemoryController {
    private final MemoryService memoryService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> createMemory(
            @RequestAttribute("memberId") Long memberId,
            @RequestPart("data") @Valid CreateMemoryRequestDTO cmRequestDTO,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        memoryService.createMemory(memberId, cmRequestDTO, file);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{memoryId}")
    public ResponseEntity<Void> updateMemory(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @RequestBody @Valid UpdateMemoryRequestDTO umRequestDTO) {
        memoryService.updateMemory(memberId, memoryId, umRequestDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{memoryId}")
    public ResponseEntity<MemoryDetailResponseDTO> findMemory(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        return ResponseEntity.ok(memoryService.findMemory(memberId, memoryId));
    }

    @GetMapping
    public ResponseEntity<List<MemoryListResponseDTO>> findMemoryList(@RequestAttribute("memberId") Long memberId, @RequestParam("sortType") SortTypeMemory sortTypeMemory,
                                                                      @RequestParam(value = "keyword", required = false) String keyword) {
        return ResponseEntity.ok(memoryService.findMemoryList(memberId, sortTypeMemory, keyword));
    }

    @DeleteMapping("/{memoryId}/left")
    public ResponseEntity<Void> leftMemory(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        memoryService.leftMemory(memoryId, memberId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{memoryId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> updateMemoryPhoto(
            @RequestAttribute("memberId") Long memberId,
            @PathVariable("memoryId") Long memoryId, // 경로 변수 이름 명시
            @RequestPart("file") MultipartFile file
    ) {
        // 1. 방어 코드: 파일이 비어있는지 체크
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build(); // 또는 custom exception 던지기
        }

        // 2. 비즈니스 로직을 서비스 하나로 묶어서 처리
        // 파일 URL 생성 + DB 업데이트를 서비스 안에서 한 번에 해결합니다.
        memoryService.updateMemoryPhoto(file, memoryId, memberId);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{memoryId}/image")
    public ResponseEntity<Void> deleteMemoryPhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        memoryService.deleteMemoryPhoto(memoryId, memberId);
        return ResponseEntity.noContent().build();
    }

}
