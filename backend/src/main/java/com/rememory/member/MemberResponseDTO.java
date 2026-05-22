package com.rememory.member;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String profileImageUrl;
    private String oauthProvider;

    public static MemberResponseDTO from(Member member) {
        return new MemberResponseDTO(
                member.getId(),
                member.getName(),
                member.getEmail(),
                member.getProfileImageUrl(),
                member.getOauthProvider()
        );
    }
}
