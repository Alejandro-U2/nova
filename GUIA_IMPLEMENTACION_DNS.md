# Guía Rápida: DNS para Nova - Implementación Paso a Paso

## Resumen Ejecutivo

Esta guía proporciona los pasos específicos para implementar una configuración DNS profesional en el proyecto Nova (red social), incluyendo configuración de seguridad de email, CDN, y ambientes de desarrollo.

## Checklist de Implementación

### Fase 1: Configuración Básica (Día 1)

#### ✅ 1. Registrar Dominio y Configurar Nameservers
```bash
# Dominio: nova-app.com
# Nameservers recomendados: Cloudflare
# ns1.cloudflare.com
# ns2.cloudflare.com
```

#### ✅ 2. Configurar Registros A Básicos
| Registro | Tipo | Valor | TTL |
|----------|------|-------|-----|
| nova-app.com | A | 192.168.1.100 | 300 |
| www.nova-app.com | CNAME | nova-app.com | 3600 |
| api.nova-app.com | A | 192.168.1.101 | 300 |

#### ✅ 3. Verificar Funcionamiento
```powershell
nslookup nova-app.com
nslookup api.nova-app.com
```

### Fase 2: Subdominios y Servicios (Día 2)

#### ✅ 4. Configurar Subdominios de Servicios
```dns
admin.nova-app.com     A     192.168.1.102
cdn.nova-app.com       CNAME d123.cloudfront.net
images.nova-app.com    CNAME nova-images.s3.amazonaws.com
```

#### ✅ 5. Ambientes de Desarrollo
```dns  
dev.nova-app.com       A     192.168.1.200
staging.nova-app.com   A     192.168.1.201
test.nova-app.com      A     192.168.1.202
```

### Fase 3: Configuración de Email (Día 3-4)

#### ✅ 6. Registros MX
```dns
nova-app.com    MX    10    mail.nova-app.com
nova-app.com    MX    20    backup-mail.nova-app.com
mail.nova-app.com      A     192.168.1.110
```

#### ✅ 7. SPF (Sender Policy Framework)
```dns
nova-app.com    TXT   "v=spf1 include:sendgrid.net include:_spf.google.com ~all"
```

#### ✅ 8. DKIM (SendGrid Example)
```dns
# Obtener de SendGrid Dashboard
s1._domainkey.nova-app.com    TXT    "k=rsa; p=MIGfMA0GCS..."
```

#### ✅ 9. DMARC
```dns
_dmarc.nova-app.com    TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@nova-app.com"
```

### Fase 4: Seguridad y Verificaciones (Día 5)

#### ✅ 10. Verificaciones de Propiedad
```dns
nova-app.com    TXT    "google-site-verification=abc123"
nova-app.com    TXT    "facebook-domain-verification=xyz789"  
```

#### ✅ 11. Configurar SSL/TLS (Cloudflare)
- Activar "Full (strict)" SSL
- Habilitar "Always Use HTTPS"
- Activar HSTS

## Configuración por Proveedor

### Opción A: Cloudflare (Recomendado)

**Pros para Nova:**
- CDN gratuito (imágenes de perfil más rápidas)
- Protección DDoS automática
- SSL automático
- Analytics del tráfico web

**Configuración en Cloudflare Dashboard:**

1. **DNS Records:**
```
Type: A, Name: @, IPv4: 192.168.1.100, Proxy: ON
Type: CNAME, Name: www, Target: nova-app.com, Proxy: ON
Type: A, Name: api, IPv4: 192.168.1.101, Proxy: OFF
Type: A, Name: admin, IPv4: 192.168.1.102, Proxy: OFF
```

2. **SSL/TLS Settings:**
```
Encryption Mode: Full (strict)
Edge Certificates: Universal SSL ON
Always Use HTTPS: ON
HSTS: ON
```

3. **Speed Optimizations:**
```
Auto Minify: CSS, JS, HTML ON
Brotli: ON
Rocket Loader: OFF (puede romper React)
```

### Opción B: AWS Route 53

**Pros para Nova:**
- Integración perfecta con AWS services
- Health checks automáticos
- Geolocation routing

**Configuración con AWS CLI:**
```bash
# Crear hosted zone
aws route53 create-hosted-zone --name nova-app.com --caller-reference nova-2024

# Crear record sets
aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch file://dns-records.json
```

## Scripts de Automatización

### PowerShell: Verificación Automática
```powershell
# Guardar como dns-check-nova.ps1
param(
    [string]$Domain = "nova-app.com",
    [switch]$Detailed
)

$subdomains = @("www", "api", "admin", "cdn", "dev", "staging")
$results = @()

Write-Host "🔍 Verificando DNS para $Domain" -ForegroundColor Cyan

foreach ($sub in $subdomains) {
    $fullDomain = if ($sub -eq "@") { $Domain } else { "$sub.$Domain" }
    
    try {
        $result = Resolve-DnsName $fullDomain -ErrorAction Stop
        $ip = $result.IPAddress -join ", "
        $status = "✅ OK"
        $color = "Green"
    } catch {
        $ip = "No resuelve"
        $status = "❌ ERROR"  
        $color = "Red"
    }
    
    Write-Host "$status $fullDomain -> $ip" -ForegroundColor $color
    
    $results += [PSCustomObject]@{
        Subdomain = $fullDomain
        IP = $ip
        Status = $status
    }
}

if ($Detailed) {
    Write-Host "`n📧 Verificando configuración de email..." -ForegroundColor Yellow
    
    # MX Records
    try {
        $mx = Resolve-DnsName -Name $Domain -Type MX
        Write-Host "MX Records:" -ForegroundColor Green
        $mx | ForEach-Object { Write-Host "  Priority $($_.Preference): $($_.NameExchange)" }
    } catch {
        Write-Host "❌ No MX records found" -ForegroundColor Red
    }
    
    # SPF Records
    try {
        $txt = Resolve-DnsName -Name $Domain -Type TXT | Where-Object { $_.Strings -like "*v=spf1*" }
        if ($txt) {
            Write-Host "SPF Record: ✅" -ForegroundColor Green
            Write-Host "  $($txt.Strings)" -ForegroundColor Gray
        } else {
            Write-Host "SPF Record: ❌ Not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "SPF Record: ❌ Error checking" -ForegroundColor Red
    }
}

return $results
```

### Uso del script:
```powershell
# Verificación básica
.\dns-check-nova.ps1

# Verificación detallada con email
.\dns-check-nova.ps1 -Detailed

# Para otro dominio
.\dns-check-nova.ps1 -Domain "test.nova-app.com"
```

## Monitoreo y Alertas

### Script de Monitoreo Continuo
```powershell
# Ejecutar cada 15 minutos via Task Scheduler
$criticalServices = @{
    "nova-app.com" = "192.168.1.100"
    "api.nova-app.com" = "192.168.1.101"  
    "admin.nova-app.com" = "192.168.1.102"
}

$alertEmail = "admin@nova-app.com"
$issues = @()

foreach ($service in $criticalServices.GetEnumerator()) {
    try {
        $resolved = Resolve-DnsName $service.Key -ErrorAction Stop
        if ($resolved.IPAddress -ne $service.Value) {
            $issues += "DNS MISMATCH: $($service.Key) resolves to $($resolved.IPAddress), expected $($service.Value)"
        }
    } catch {
        $issues += "DNS FAILURE: $($service.Key) failed to resolve"
    }
}

if ($issues.Count -gt 0) {
    $body = "DNS Issues detected for Nova:`n`n" + ($issues -join "`n")
    # Integrar con sistema de notificaciones de Nova
    Send-AlertToSlack -Message $body
    # O enviar email de emergencia
}
```

## Consideraciones Especiales para Nova

### 1. Manejo de Imágenes de Usuario
```dns
# CDN para imágenes de perfil
avatars.nova-app.com    CNAME    nova-avatars.s3.amazonaws.com
# CDN para posts con imágenes  
media.nova-app.com      CNAME    d987654321.cloudfront.net
```

### 2. API Rate Limiting por Geolocation
```json
// Configuración Route 53 Geolocation
{
  "Type": "A",
  "SetIdentifier": "Mexico",
  "GeoLocation": {"CountryCode": "MX"},  
  "ResourceRecords": [{"Value": "192.168.1.101"}]
},
{
  "Type": "A", 
  "SetIdentifier": "USA",
  "GeoLocation": {"CountryCode": "US"},
  "ResourceRecords": [{"Value": "10.0.1.101"}]  
}
```

### 3. Backup y Failover
```dns
# Configurar health checks para failover automático
api.nova-app.com    A    192.168.1.101    (Primary)
api.nova-app.com    A    192.168.1.201    (Backup - menor prioridad)
```

## Métricas y KPIs DNS

### Métricas Importantes para Nova:
1. **Resolution Time**: < 50ms promedio
2. **Uptime**: 99.9% disponibilidad
3. **Cache Hit Ratio**: > 95% 
4. **Email Deliverability**: > 98%

### Herramientas de Monitoreo:
- **Pingdom**: Monitoreo de uptime
- **GTmetrix**: Análisis de performance  
- **Mail-Tester**: Verificación de email
- **DNSPerf**: Benchmarking de proveedores DNS

## Troubleshooting Rápido

### Problema: "Nova no carga"
```powershell
# 1. Verificar resolución DNS
nslookup nova-app.com

# 2. Verificar desde diferentes DNS
nslookup nova-app.com 8.8.8.8
nslookup nova-app.com 1.1.1.1

# 3. Verificar propagación global  
# Usar: dnschecker.org
```

### Problema: "Emails van a spam"
```powershell
# 1. Verificar SPF
nslookup -type=TXT nova-app.com | findstr "spf1"

# 2. Verificar DMARC
nslookup -type=TXT _dmarc.nova-app.com

# 3. Test delivery
# Usar: mail-tester.com
```

### Problema: "API lenta desde móviles"
```bash
# Verificar si CDN está activo
curl -I https://api.nova-app.com
# Buscar header: CF-Cache-Status o X-Cache
```

---

## Timeline de Implementación Sugerido

| Día | Tarea | Tiempo Est. | Prioridad |
|-----|-------|-------------|-----------|
| 1 | Configuración DNS básica | 2 horas | Alta |
| 2 | Subdominios y CDN | 3 horas | Alta |  
| 3 | Configuración email (SPF/MX) | 4 horas | Media |
| 4 | DKIM y DMARC | 3 horas | Media |
| 5 | Monitoreo y alertas | 2 horas | Baja |

**Total: ~14 horas de implementación**

Esta configuración dará a Nova una base DNS sólida, escalable y profesional para operar como red social empresarial.