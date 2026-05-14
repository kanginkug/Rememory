package com.rememory.invitation;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QInvitation is a Querydsl query type for Invitation
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QInvitation extends EntityPathBase<Invitation> {

    private static final long serialVersionUID = -103699007L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QInvitation invitation = new QInvitation("invitation");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> expiresAt = createDateTime("expiresAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath inviteCode = createString("inviteCode");

    public final com.rememory.member.QMember inviter;

    public final NumberPath<Integer> maxUses = createNumber("maxUses", Integer.class);

    public final com.rememory.memory.QMemory memory;

    public final NumberPath<Integer> usedCount = createNumber("usedCount", Integer.class);

    public QInvitation(String variable) {
        this(Invitation.class, forVariable(variable), INITS);
    }

    public QInvitation(Path<? extends Invitation> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QInvitation(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QInvitation(PathMetadata metadata, PathInits inits) {
        this(Invitation.class, metadata, inits);
    }

    public QInvitation(Class<? extends Invitation> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.inviter = inits.isInitialized("inviter") ? new com.rememory.member.QMember(forProperty("inviter")) : null;
        this.memory = inits.isInitialized("memory") ? new com.rememory.memory.QMemory(forProperty("memory"), inits.get("memory")) : null;
    }

}

