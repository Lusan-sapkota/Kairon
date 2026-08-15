package main

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strings"
	"time"
)

func sendSMTP(cfg SMTPConfig, to, subject, textBody, htmlBody string) error {
	if err := smtpReady(cfg); err != nil {
		return err
	}
	from := fromAddress(cfg)
	if from == "" {
		return fmt.Errorf("from address is required")
	}
	if to == "" {
		to = recipientFor(cfg)
	}

	msg, err := buildMIME(from, to, cfg.FromName, subject, textBody, htmlBody)
	if err != nil {
		return err
	}

	addr := net.JoinHostPort(cfg.Host, fmt.Sprintf("%d", cfg.Port))
	tlsCfg := &tls.Config{ServerName: cfg.Host, MinVersion: tls.VersionTLS12}

	var auth smtp.Auth
	if cfg.Username != "" {
		auth = smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	}

	switch strings.ToLower(cfg.Security) {
	case "tls":
		return sendImplicitTLS(addr, tlsCfg, auth, from, to, msg)
	case "none":
		return smtp.SendMail(addr, auth, from, []string{to}, msg)
	default:
		return sendStartTLS(addr, tlsCfg, auth, from, to, msg)
	}
}

func sendImplicitTLS(addr string, tlsCfg *tls.Config, auth smtp.Auth, from, to string, msg []byte) error {
	dialer := &net.Dialer{Timeout: 20 * time.Second}
	conn, err := tls.DialWithDialer(dialer, "tcp", addr, tlsCfg)
	if err != nil {
		return err
	}
	defer conn.Close()
	client, err := smtp.NewClient(conn, tlsCfg.ServerName)
	if err != nil {
		return err
	}
	defer client.Close()
	return smtpData(client, auth, from, to, msg)
}

func sendStartTLS(addr string, tlsCfg *tls.Config, auth smtp.Auth, from, to string, msg []byte) error {
	dialer := &net.Dialer{Timeout: 20 * time.Second}
	conn, err := dialer.Dial("tcp", addr)
	if err != nil {
		return err
	}
	host, _, _ := net.SplitHostPort(addr)
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		_ = conn.Close()
		return err
	}
	defer client.Close()
	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(tlsCfg); err != nil {
			return err
		}
	}
	return smtpData(client, auth, from, to, msg)
}

func smtpData(client *smtp.Client, auth smtp.Auth, from, to string, msg []byte) error {
	if auth != nil {
		if ok, _ := client.Extension("AUTH"); ok {
			if err := client.Auth(auth); err != nil {
				return err
			}
		}
	}
	if err := client.Mail(from); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}
	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write(msg); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}
	return client.Quit()
}

func buildMIME(from, to, fromName, subject, textBody, htmlBody string) ([]byte, error) {
	boundary := "kairon-alt-" + fmt.Sprintf("%d", time.Now().UnixNano())
	display := from
	if strings.TrimSpace(fromName) != "" {
		display = fmt.Sprintf(`"%s" <%s>`, strings.ReplaceAll(fromName, `"`, ""), from)
	}
	var b strings.Builder
	b.WriteString(fmt.Sprintf("From: %s\r\n", display))
	b.WriteString(fmt.Sprintf("To: %s\r\n", to))
	b.WriteString(fmt.Sprintf("Subject: %s\r\n", headerSafe(subject)))
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("X-Mailer: Kairon\r\n")
	if htmlBody == "" {
		b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n\r\n")
		b.WriteString(textBody)
		return []byte(b.String()), nil
	}
	b.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n\r\n", boundary))
	b.WriteString(fmt.Sprintf("--%s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s\r\n", boundary, textBody))
	b.WriteString(fmt.Sprintf("--%s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s\r\n", boundary, htmlBody))
	b.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	return []byte(b.String()), nil
}

func headerSafe(s string) string {
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	return s
}

func isRetryableMailError(err error) bool {
	if err == nil {
		return false
	}
	if nerr, ok := err.(net.Error); ok && (nerr.Timeout() || nerr.Temporary()) {
		return true
	}
	msg := strings.ToLower(err.Error())
	retryHints := []string{
		"timeout", "timed out", "no such host", "connection refused",
		"network is unreachable", "temporary failure", "i/o timeout",
		"broken pipe", "connection reset", "eof", "tls handshake",
		"dial tcp", "no route to host", "server misbehaving",
		"try again", "4.", "too many",
	}
	for _, h := range retryHints {
		if strings.Contains(msg, h) {
			return true
		}
	}
	permHints := []string{"535", "534", "530", "auth", "authentication", "5.7.", "mailbox unavailable"}
	for _, h := range permHints {
		if strings.Contains(msg, h) {
			return false
		}
	}
	return true
}
