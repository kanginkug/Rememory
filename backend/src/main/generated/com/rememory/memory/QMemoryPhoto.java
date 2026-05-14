package com.rememory.memory;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMemoryPhoto is a Querydsl query type for MemoryPhoto
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMemoryPhoto extends EntityPathBase<MemoryPhoto> {

    private static final long serialVersionUID = 451965041L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMemoryPhoto memoryPhoto = new QMemoryPhoto("memoryPhoto");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath imageUrl = createString("imageUrl");

    public final QMemory memory;

    public QMemoryPhoto(String variable) {
        this(MemoryPhoto.class, forVariable(variable), INITS);
    }

    public QMemoryPhoto(Path<? extends MemoryPhoto> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMemoryPhoto(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMemoryPhoto(PathMetadata metadata, PathInits inits) {
        this(MemoryPhoto.class, metadata, inits);
    }

    public QMemoryPhoto(Class<? extends MemoryPhoto> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.memory = inits.isInitialized("memory") ? new QMemory(forProperty("memory"), inits.get("memory")) : null;
    }

}

