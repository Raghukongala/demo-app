package com.bank;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin
public class AccountController {

    private final AccountRepository repo;

    public AccountController(AccountRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "healthy", "service", "account-service"));
    }

    @PostMapping
    public ResponseEntity<?> createAccount(@RequestBody Map<String, String> body) {
        Account account = new Account();
        account.setOwnerName(body.get("ownerName"));
        account.setEmail(body.get("email"));
        account.setAccountType(body.getOrDefault("accountType", "SAVINGS"));
        // generate unique account number
        account.setAccountNumber("RK" + System.currentTimeMillis());
        return ResponseEntity.ok(repo.save(account));
    }

    @GetMapping("/{accountNumber}")
    public ResponseEntity<?> getAccount(@PathVariable String accountNumber) {
        return repo.findByAccountNumber(accountNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{accountNumber}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable String accountNumber, @RequestBody Map<String, BigDecimal> body) {
        return repo.findByAccountNumber(accountNumber).map(account -> {
            BigDecimal amount = body.get("amount");
            if (account.getBalance().compareTo(amount) < 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient balance"));
            }
            account.setBalance(account.getBalance().subtract(amount));
            return ResponseEntity.ok(repo.save(account));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{accountNumber}/deposit")
    public ResponseEntity<?> deposit(@PathVariable String accountNumber, @RequestBody Map<String, BigDecimal> body) {
        return repo.findByAccountNumber(accountNumber).map(account -> {
            account.setBalance(account.getBalance().add(body.get("amount")));
            return ResponseEntity.ok(repo.save(account));
        }).orElse(ResponseEntity.notFound().build());
    }
}
