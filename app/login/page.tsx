"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    // Load remembered email on mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem("rememberedEmail");
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log("Attempting login with:", email);
            const response = await api.post("/auth/login", { email, password });
            console.log("Login response:", response.data);

            // Backend wraps response in {success, data, timestamp}
            const tokens = response.data.data || response.data;
            console.log("Tokens extracted:", { accessToken: tokens.accessToken?.substring(0, 20), refreshToken: tokens.refreshToken?.substring(0, 20) });

            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);

            // Handle Remember Me
            if (rememberMe) {
                localStorage.setItem("rememberedEmail", email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            toast.success("Login successful!");

            // Force navigation
            window.location.href = "/dashboard";
        } catch (error: any) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Login failed. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 p-4">
            <Card className="w-full max-w-md border-none shadow-2xl">
                <CardHeader className="text-center pb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center mb-4">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-heading">
                        <span className="text-gold-500">KINGBRIDGE</span>
                        <span className="text-gold-400 block text-sm tracking-widest mt-1">TOWER</span>
                    </CardTitle>
                    <p className="text-gray-600 mt-2">Rent Roll Management System</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gold-500">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@kingbridge.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-white text-gray-900 border-gray-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gold-500">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-white text-gray-900 border-gray-300"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                Remember me
                            </Label>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 btn-gold text-lg font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
