package com.rememory.place;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QPlacePhoto is a Querydsl query type for PlacePhoto
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPlacePhoto extends EntityPathBase<PlacePhoto> {

    private static final long serialVersionUID = 2032335967L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QPlacePhoto placePhoto = new QPlacePhoto("placePhoto");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final com.rememory.member.QMember creator;

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> displayOrder = createNumber("displayOrder", Integer.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath imageUrl = createString("imageUrl");

    public final QPlace place;

    public QPlacePhoto(String variable) {
        this(PlacePhoto.class, forVariable(variable), INITS);
    }

    public QPlacePhoto(Path<? extends PlacePhoto> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QPlacePhoto(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QPlacePhoto(PathMetadata metadata, PathInits inits) {
        this(PlacePhoto.class, metadata, inits);
    }

    public QPlacePhoto(Class<? extends PlacePhoto> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.creator = inits.isInitialized("creator") ? new com.rememory.member.QMember(forProperty("creator")) : null;
        this.place = inits.isInitialized("place") ? new QPlace(forProperty("place"), inits.get("place")) : null;
    }

}

