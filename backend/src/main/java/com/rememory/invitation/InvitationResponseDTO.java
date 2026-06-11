package com.rememory.invitation;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class InvitationResponseDTO {
    private String inviteCode;

    public static InvitationResponseDTO from(String inviteCode) {
        return new InvitationResponseDTO(inviteCode);
    }
}
