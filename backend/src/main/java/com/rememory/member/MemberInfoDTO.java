package com.rememory.member;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberInfoDTO {
    private Long memberId;
    private String name;
    private String profileImageUrl;

    public static MemberInfoDTO from(Long memberId, String name, String profileImageUrl) {
        return new MemberInfoDTO(
                memberId,
                name,
                profileImageUrl
        );
    }
}
