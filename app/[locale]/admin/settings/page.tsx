import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '../../../../components/ui/switch'
import { Button } from '@/components/ui/button'
import { Globe, Shield, Bell, Zap } from 'lucide-react'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Platform Settings</h1>
                <p className="text-muted-foreground mt-1">Configure global site variables and API integrations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" /> General
                        </CardTitle>
                        <CardDescription>Basic site identity and regional settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Site Name</Label>
                            <Input placeholder="UAEDISCOUNTHUB" defaultValue="UAEDISCOUNTHUB" />
                        </div>
                        <div className="space-y-2">
                            <Label>Primary Domain</Label>
                            <Input placeholder="https://uaediscounthub.com" defaultValue="https://uaediscounthub.com" />
                        </div>
                    </CardContent>
                </Card>

                {/* Affiliate & SEO */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" /> Integrations
                        </CardTitle>
                        <CardDescription>DeepSeek AI and Affiliate tracking keys.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>DeepSeek API Status</Label>
                            <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Amazon Associate ID</Label>
                            <Input placeholder="uaediscount-21" />
                        </div>
                    </CardContent>
                </Card>

                {/* Maintenance & Security */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" /> System Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-500/5 border-orange-500/20">
                            <div>
                                <h4 className="font-bold text-orange-600">Maintenance Mode</h4>
                                <p className="text-sm text-orange-600/80">Take the site offline for updates. Admin panel remains accessible.</p>
                            </div>
                            <Switch />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                            <div>
                                <h4 className="font-bold text-blue-600">Newsletter Auto-Sync</h4>
                                <p className="text-sm text-blue-600/80">Automatically sync leads to external CRM every 24 hours.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button size="lg" className="px-8 font-bold">Save All Changes</Button>
            </div>
        </div>
    )
}
