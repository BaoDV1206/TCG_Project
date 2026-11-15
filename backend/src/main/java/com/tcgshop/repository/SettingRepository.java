package com.tcgshop.repository;

import com.tcgshop.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingRepository extends JpaRepository<Setting, String> {
}
