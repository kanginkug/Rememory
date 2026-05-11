package com.rememory.invitation;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
public class Invitations {

    @Id
    @GeneratedValue
    @Column(name = "invitation_id")
    private Long id;

    @OneToMany
    private Long groupId;

    @OneToMany
    private Long memberId;

    private String inviteCode;

    private LocalDateTime expiresAt;
}
