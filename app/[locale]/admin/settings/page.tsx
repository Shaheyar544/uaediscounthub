'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { 
    Globe, Shield, Bell, Zap, Share2, Languages, 
    Smartphone, Twitter, Linkedin, Instagram, Loader2, Save 
} from 'lucide-react'

/**
 * Admin: Platform Settings Page
 * Manages global site configuration, promotions, and API integrations.
 */
export default function AdminSettingsPage() {
    const [saving, setSaving] = useState(false)
    
    // General Settings State
    const [siteName, setSiteName] = useState('UAEDISCOUNTHUB')
    const [primaryDomain, setPrimaryDomain] = useState('https://uaediscounthub.com')

    // Promotions & Announcements State
    const [enableTopBar, setEnableTopBar] = useState(true)
    const [announcementText, setAnnouncementText] = useState('Flash Sale - Up to 30% off on Smartphones!')
    const [promoCode, setPromoCode] = useState('TECH30')
    const [countdownEndDate, setCountdownEndDate] = useState('')

    // Integrations State
    const [amazonID, setAmazonID] = useState('uaediscount-21')
    const [noonAffiliateID, setNoonAffiliateID] = useState('')
    const [sharafDGPartnerKey, setSharafDGPartnerKey] = useState('')
    const [carrefourTrackingID, setCarrefourTrackingID] = useState('')

    // Social & Contact State
    const [whatsappNumber, setWhatsappNumber] = useState('')
    const [twitterUrl, setTwitterUrl] = useState('')
    const [linkedinUrl, setLinkedinUrl] = useState('')
    const [instagramUrl, setInstagramUrl] = useState('')

    // Localization State
    const [defaultCurrency, setDefaultCurrency] = useState('AED')
    const [targetRegions, setTargetRegions] = useState(['UAE'])

    // System Controls State
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [newsletterAutoSync, setNewsletterAutoSync] = useState(true)

    const handleSave = async () => {
        setSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setSaving(false)
        alert('All settings saved successfully!')
    }

    const toggleRegion = (region: string) => {
        setTargetRegions(prev => 
            prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
        )
    }

    return (
        <div className="space-y-8 p-1">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Platform Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure global site variables and API integrations.</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    size="lg" 
                    className="px-8 font-bold bg-[#0057FF] hover:bg-[#0047dd]"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                    Save All Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px]">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[18px] font-extrabold">
                            <Globe className="w-5 h-5 text-[#0057FF]" /> General Identity
                        </CardTitle>
                        <CardDescription className="text-[12px]">Basic site identity and branding settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Site Name</Label>
                            <Input 
                                className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                value={siteName} 
                                onChange={(e) => setSiteName(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Primary Domain</Label>
                            <Input 
                                className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                value={primaryDomain} 
                                onChange={(e) => setPrimaryDomain(e.target.value)} 
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Promotions & Announcements */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px]">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[18px] font-extrabold">
                            <Bell className="w-5 h-5 text-[#FF6B00]" /> Promotions & Announcements
                        </CardTitle>
                        <CardDescription className="text-[12px]">Manage global top bars and countdown timers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-[8px] border border-[#DDE3EF]">
                            <Label className="text-[13px] font-bold text-[#0D1117]">Enable Top Bar</Label>
                            <Switch checked={enableTopBar} onCheckedChange={setEnableTopBar} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Announcement Text</Label>
                            <Input 
                                className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                placeholder="Flash Sale - Up to 30% off..."
                                value={announcementText}
                                onChange={(e) => setAnnouncementText(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Promo Code</Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    placeholder="e.g. SAVE20"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Countdown End Date</Label>
                                <Input 
                                    type="datetime-local"
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    value={countdownEndDate}
                                    onChange={(e) => setCountdownEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Integrations */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px]">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[18px] font-extrabold">
                            <Zap className="w-5 h-5 text-[#00C48C]" /> Integrations
                        </CardTitle>
                        <CardDescription className="text-[12px]">Manage Affiliate networks and AI API keys.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Amazon Associate ID</Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    value={amazonID}
                                    onChange={(e) => setAmazonID(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Noon Affiliate ID</Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    value={noonAffiliateID}
                                    onChange={(e) => setNoonAffiliateID(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Sharaf DG Partner Key</Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    value={sharafDGPartnerKey}
                                    onChange={(e) => setSharafDGPartnerKey(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Carrefour Tracking ID</Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    value={carrefourTrackingID}
                                    onChange={(e) => setCarrefourTrackingID(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-3 bg-[#E6FAF5] rounded-[8px] flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#00A070]">DeepSeek AI Engine</span>
                            <div className="flex items-center gap-2 text-[#00A070] text-[11px] font-extrabold">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00A070] animate-pulse" /> CONNECTED
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Localization */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px]">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[18px] font-extrabold">
                            <Languages className="w-5 h-5 text-[#0057FF]" /> Localization
                        </CardTitle>
                        <CardDescription className="text-[12px]">Configure regional settings and default currencies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Default Currency</Label>
                            <select 
                                className="w-full bg-[#F6F8FC] border-[1.5px] border-[#DDE3EF] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[#0057FF]"
                                value={defaultCurrency}
                                onChange={(e) => setDefaultCurrency(e.target.value)}
                            >
                                <option value="AED">AED - UAE Dirham</option>
                                <option value="SAR">SAR - Saudi Riyal</option>
                                <option value="QAR">QAR - Qatari Riyal</option>
                                <option value="KWD">KWD - Kuwaiti Dinar</option>
                                <option value="BHD">BHD - Bahraini Dinar</option>
                                <option value="OMR">OMR - Omani Rial</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-[#8A94A6] uppercase">Target Regions</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['UAE', 'KSA', 'GCC', 'QA', 'KW', 'BH', 'OM'].map((region) => (
                                    <button
                                        key={region}
                                        onClick={() => toggleRegion(region)}
                                        className={`px-3 py-2 rounded-[8px] text-[12px] font-bold transition-all border ${
                                            targetRegions.includes(region) 
                                            ? 'bg-[#0057FF] text-white border-[#0057FF]' 
                                            : 'bg-[#F6F8FC] text-[#4B5675] border-[#DDE3EF] hover:border-[#0057FF]'
                                        }`}
                                    >
                                        {region}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Social & Contact */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px] lg:col-span-2">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[18px] font-extrabold">
                            <Share2 className="w-5 h-5 text-[#0057FF]" /> Social & Contact
                        </CardTitle>
                        <CardDescription className="text-[12px]">Manage global footer links and contact info.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase flex items-center gap-2">
                                    <Smartphone className="w-3 h-3" /> WhatsApp Alert Number
                                </Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    placeholder="+971 50 123 4567"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase flex items-center gap-2">
                                    <Twitter className="w-3 h-3" /> X (Twitter) URL
                                </Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    placeholder="https://x.com/uaediscounthub"
                                    value={twitterUrl}
                                    onChange={(e) => setTwitterUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase flex items-center gap-2">
                                    <Linkedin className="w-3 h-3" /> LinkedIn URL
                                </Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    placeholder="https://linkedin.com/company/uaediscounthub"
                                    value={linkedinUrl}
                                    onChange={(e) => setLinkedinUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase flex items-center gap-2">
                                    <Instagram className="w-3 h-3" /> Instagram URL
                                </Label>
                                <Input 
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    placeholder="https://instagram.com/uaediscounthub"
                                    value={instagramUrl}
                                    onChange={(e) => setInstagramUrl(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Controls */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px] lg:col-span-2">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#FF3B30]">
                            <Shield className="w-5 h-5 text-[#FF3B30]" /> System Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-[12px] bg-[#FFF0EF] border-[#FF3B30]/20">
                            <div>
                                <h4 className="font-bold text-[#FF3B30] text-[14px]">Maintenance Mode</h4>
                                <p className="text-[11px] text-[#FF3B30]/80">Take the site offline for updates. Admin panel remains accessible.</p>
                            </div>
                            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-[12px] bg-[#E8F0FF] border-[#0057FF]/20">
                            <div>
                                <h4 className="font-bold text-[#0057FF] text-[14px]">Newsletter Auto-Sync</h4>
                                <p className="text-[11px] text-[#0057FF]/80">Automatically sync leads to external CRM every 24 hours.</p>
                            </div>
                            <Switch checked={newsletterAutoSync} onCheckedChange={setNewsletterAutoSync} />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="flex justify-end pt-4">
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    size="lg" 
                    className="px-10 py-6 rounded-[12px] font-bold text-[16px] bg-[#0057FF] hover:bg-[#0047dd] shadow-lg shadow-[#0057FF]/20"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Save All Settings
                </Button>
            </div>
        </div>
    )
}
