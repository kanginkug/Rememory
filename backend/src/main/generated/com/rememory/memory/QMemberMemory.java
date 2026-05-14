package com.rememory.memory;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMemberMemory is a Querydsl query type for MemberMemory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMemberMemory extends EntityPathBase<MemberMemory> {

    private static final long serialVersionUID = -39892613L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMemberMemory memberMemory = new QMemberMemory("memberMemory");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final DateTimePath<java.time.LocalDateTime> joinedAt = createDateTime("joinedAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> leftAt = createDateTime("leftAt", java.time.LocalDateTime.class);

    public final com.rememory.member.QMember member;

    public final QMemory memory;

    public QMemberMemory(String variable) {
        this(MemberMemory.class, forVariable(variable), INITS);
    }

    public QMemberMemory(Path<? extends MemberMemory> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMemberMemory(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMemberMemory(PathMetadata metadata, PathInits inits) {
        this(MemberMemory.class, metadata, inits);
    }

    public QMemberMemory(Class<? extends MemberMemory> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.member = inits.isInitialized("member") ? new com.rememory.member.QMember(forProperty("member")) : null;
        this.memory = inits.isInitialized("memory") ? new QMemory(forProperty("memory"), inits.get("memory")) : null;
    }

}

