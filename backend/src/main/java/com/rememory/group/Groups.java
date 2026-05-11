package com.rememory.group;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;

@Entity
@Getter
public class Groups {

    @Id
    @GeneratedValue
    @Column(name = "group_id")
    private Long id;

    private String name;

    private String description;

    private String coverImageUrl;

    // 개인 메모리인지
    private Boolean isPersonal;

}
