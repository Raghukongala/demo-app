package com.bank;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Data
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private String ownerName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.valueOf(10000.00); // default opening balance

    @Column(nullable = false)
    private String accountType = "SAVINGS"; // SAVINGS or CURRENT

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
