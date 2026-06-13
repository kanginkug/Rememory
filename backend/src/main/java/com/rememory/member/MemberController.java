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

    /** GET /api/members/me - 내 정보 조회 */
    @GetMapping("/me")
    public ResponseEntity<MemberResponseDTO> getMyInfo(@RequestAttribute("memberId") Long memberId) {
        Member member = memberService.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        return ResponseEntity.ok(MemberResponseDTO.from(member));
    }

    /** DELETE /api/members/me - 회원 탈퇴 */
    @DeleteMapping("/me")
    public ResponseEntity<Void> delete(@RequestAttribute("memberId") Long memberId) {
        memberService.delete(memberId);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/members/me/stats - 내 통계 조회 */
    @GetMapping("/me/stats")
    public ResponseEntity<MemberStatsResponseDTO> getMyStats(@RequestAttribute("memberId") Long memberId) {
        return ResponseEntity.ok(memberService.getMyStats(memberId));
    }

    /** PUT /api/members/me - 닉네임 변경 */
    @PutMapping("/me")
    public ResponseEntity<Void> updateMyInfo(@RequestAttribute("memberId") Long memberId, @RequestBody @Valid UpdateMemberRequestDTO dto) {
        memberService.updateMyInfo(memberId, dto);
        return ResponseEntity.noContent().build();
    }

    /** PUT /api/members/me/photo - 프로필 이미지 변경 */
    @PutMapping("/me/photo")
    public ResponseEntity<Void> updateMyProfile(@RequestAttribute("memberId") Long memberId, @RequestBody @Valid UpdateMemberPhotoRequestDTO dto) {
        memberService.updateMyProfileImg(memberId, dto);
        return ResponseEntity.noContent().build();
    }
}
