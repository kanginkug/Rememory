package com.rememory.member;


import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/me")
    public ResponseEntity<MemberResponseDTO> getMyInfo(@RequestAttribute("memberId") Long memberId) {
        Member member = memberService.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        return ResponseEntity.ok(MemberResponseDTO.from(member));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> delete(@RequestAttribute("memberId") Long memberId) {
        memberService.delete(memberId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/stats")
    public ResponseEntity<MemberStatsResponseDTO> getMyStats(@RequestAttribute("memberId") Long memberId) {
        return ResponseEntity.ok(memberService.getMyStats(memberId));
    }

    @PutMapping("/me")
    public ResponseEntity<Void> updateMyInfo(@RequestAttribute("memberId") Long memberId, @RequestBody @Valid UpdateMemberRequestDTO dto) {
        memberService.updateMyInfo(memberId, dto);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/photo")
    public ResponseEntity<Void> updateMyProfile(@RequestAttribute("memberId") Long memberId, @RequestBody @Valid UpdateMemberPhotoRequestDTO dto) {
        memberService.updateMyProfileImg(memberId, dto);
        return ResponseEntity.noContent().build();
    }
}
