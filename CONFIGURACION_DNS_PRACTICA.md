# Configuración DNS Práctica para Nova

## Archivo de Zona DNS Completo

```bind
$TTL 3600
@       IN  SOA     ns1.cloudflare.com. admin.nova-app.com. (
                    2024101501  ; Serial
                    7200        ; Refresh
                    3600        ; Retry
                    604800      ; Expire
                    300         ; Minimum TTL
                    )

; Servidores de nombres
@               IN  NS      ns1.cloudflare.com.
@               IN  NS      ns2.cloudflare.com.

; Registro principal
@               IN  A       192.168.1.100
www             IN  CNAME   @

; Subdominios de servicios
api             IN  A       192.168.1.101
admin           IN  A       192.168.1.102
cdn             IN  CNAME   d123456789.cloudfront.net.
images          IN  CNAME   nova-images.s3.amazonaws.com.

; Ambientes de desarrollo
dev             IN  A       192.168.1.200
staging         IN  A       192.168.1.201
test            IN  A       192.168.1.202

; Configuración de email
@               IN  MX      10  mail.nova-app.com.
@               IN  MX      20  backup-mail.nova-app.com.
mail            IN  A       192.168.1.110
backup-mail     IN  A       192.168.1.111

; Registros SPF
@               IN  TXT     "v=spf1 include:sendgrid.net include:_spf.google.com ~all"

; Registro DMARC
_dmarc          IN  TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@nova-app.com; ruf=mailto:dmarc-failures@nova-app.com; fo=1"

; Registro DKIM (ejemplo con SendGrid)
s1._domainkey   IN  TXT     "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDVp..."

; Verificaciones de servicios
@               IN  TXT     "google-site-verification=abc123def456ghi789"
@               IN  TXT     "facebook-domain-verification=xyz789abc123def456"

; Registros para servicios específicos
_sip._tcp       IN  SRV     10 5 5060 sip.nova-app.com.
_xmpp-server._tcp IN SRV    5 5 5269 xmpp.nova-app.com.
```

## Configuración por Proveedor

### Cloudflare (Recomendado para Nova)

**Ventajas:**
- CDN gratuito integrado
- Protección DDoS automática
- SSL automático
- Analytics detallados

**Configuración básica:**
```javascript
// Via Cloudflare API
const dnsRecords = [
  {
    type: "A",
    name: "nova-app.com",
    content: "192.168.1.100",
    ttl: 3600,
    proxied: true // Activa CDN y protección
  },
  {
    type: "CNAME", 
    name: "www",
    content: "nova-app.com",
    ttl: 3600,
    proxied: true
  },
  {
    type: "A",
    name: "api",
    content: "192.168.1.101", 
    ttl: 300,
    proxied: false // API no necesita proxy
  }
];
```

### AWS Route 53

**Configuración JSON:**
```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "nova-app.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "192.168.1.100"}]
      }
    },
    {
      "Action": "CREATE", 
      "ResourceRecordSet": {
        "Name": "api.nova-app.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "192.168.1.101"}]
      }
    }
  ]
}
```

## Scripts de Automatización

### Script PowerShell para verificar DNS

```powershell
# Verificación completa de DNS para Nova
$domain = "nova-app.com"
$subdominios = @("www", "api", "admin", "cdn", "dev", "staging")

Write-Host "=== Verificación DNS para $domain ===" -ForegroundColor Green

# Verificar registro principal
Write-Host "`nRegistro A principal:" -ForegroundColor Yellow
nslookup $domain

# Verificar subdominios
foreach ($sub in $subdominios) {
    Write-Host "`nVerificando $sub.$domain:" -ForegroundColor Yellow
    nslookup "$sub.$domain"
}

# Verificar registros MX
Write-Host "`nRegistros MX (Email):" -ForegroundColor Yellow
nslookup -type=MX $domain

# Verificar registros TXT (SPF, DMARC)
Write-Host "`nRegistros TXT:" -ForegroundColor Yellow
nslookup -type=TXT $domain

Write-Host "`n=== Verificación completada ===" -ForegroundColor Green
```

### Script para monitoreo continuo

```powershell
# Monitor DNS para Nova - Ejecutar cada hora
$logFile = "C:\logs\dns-monitor-nova.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Test-DnsRecord {
    param($name, $expectedIP)
    
    try {
        $result = Resolve-DnsName $name -ErrorAction Stop
        $actualIP = $result.IPAddress
        
        if ($actualIP -eq $expectedIP) {
            "$timestamp - OK: $name resolves to $actualIP" | Out-File $logFile -Append
            return $true
        } else {
            "$timestamp - ERROR: $name resolves to $actualIP, expected $expectedIP" | Out-File $logFile -Append
            return $false
        }
    } catch {
        "$timestamp - ERROR: Failed to resolve $name - $($_.Exception.Message)" | Out-File $logFile -Append
        return $false
    }
}

# Lista de registros críticos para Nova
$criticalRecords = @{
    "nova-app.com" = "192.168.1.100"
    "api.nova-app.com" = "192.168.1.101"
    "admin.nova-app.com" = "192.168.1.102"
}

$allOk = $true
foreach ($record in $criticalRecords.GetEnumerator()) {
    if (-not (Test-DnsRecord $record.Key $record.Value)) {
        $allOk = $false
    }
}

if (-not $allOk) {
    # Enviar alerta (integrar con sistema de notificaciones de Nova)
    Send-MailMessage -To "admin@nova-app.com" -Subject "DNS Alert - Nova App" -Body "DNS issues detected. Check log: $logFile"
}
```

## Configuración de Email Seguro

### SendGrid Integration

```javascript
// Configuración en el backend de Nova
const sgMail = require('@sendgrid/mail');

// Configurar DKIM y SPF en DNS primero:
// SPF: "v=spf1 include:sendgrid.net ~all"
// DKIM: Obtener de SendGrid dashboard

const emailConfig = {
  from: 'noreply@nova-app.com', // Debe coincidir con dominio verificado
  replyTo: 'support@nova-app.com'
};

// Ejemplo de email de notificación
async function sendNotificationEmail(userEmail, notificationType, data) {
  const msg = {
    to: userEmail,
    from: emailConfig.from,
    replyTo: emailConfig.replyTo,
    subject: `Nova - ${notificationType}`,
    html: generateNotificationHTML(notificationType, data)
  };
  
  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email failed:', error);
  }
}
```

### Verificación DMARC

```bash
# Comando para verificar configuración DMARC
nslookup -type=TXT _dmarc.nova-app.com

# Resultado esperado:
# _dmarc.nova-app.com text = "v=DMARC1; p=quarantine; rua=mailto:dmarc@nova-app.com"
```

## Troubleshooting Common Issues

### Problema 1: CNAME en dominio raíz

**Incorrecto:**
```dns
nova-app.com    CNAME   server.hosting.com  # ❌ No funciona
```

**Correcto:**
```dns
nova-app.com    A       192.168.1.100       # ✅ Usar A record
www.nova-app.com CNAME  nova-app.com        # ✅ CNAME solo en subdominio
```

### Problema 2: TTL muy alto durante cambios

**Durante desarrollo/cambios:**
```dns
nova-app.com    A    192.168.1.100    300    # 5 minutos
```

**En producción estable:**
```dns  
nova-app.com    A    192.168.1.100    3600   # 1 hora
```

### Problema 3: Emails van a spam

**Checklist de configuración:**
1. ✅ SPF configurado
2. ✅ DKIM configurado  
3. ✅ DMARC configurado
4. ✅ PTR record (reverse DNS)
5. ✅ Dominio "warming up" gradualmente

## Herramientas de Testing

### Online Tools
- **DNS Checker**: https://dnschecker.org/
- **MX Toolbox**: https://mxtoolbox.com/
- **DMARC Analyzer**: https://dmarcanalyzer.com/

### Comandos locales útiles

```powershell
# Verificación completa
nslookup nova-app.com
nslookup -type=MX nova-app.com  
nslookup -type=TXT nova-app.com
nslookup -type=AAAA nova-app.com

# Verificar desde diferentes servidores DNS
nslookup nova-app.com 8.8.8.8        # Google DNS
nslookup nova-app.com 1.1.1.1        # Cloudflare DNS
nslookup nova-app.com 208.67.222.222 # OpenDNS
```

Esta configuración asegura que Nova tenga una base DNS sólida, segura y escalable para crecer como red social.