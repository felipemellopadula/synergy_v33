import { useEffect, useMemo, useState } from "react";
          <Button asChild variant="outline"><Link to="/" replace>Voltar</Link></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações do perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview || undefined} alt="Foto de perfil do usuário" />
                    <AvatarFallback>{profile.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <Label htmlFor="avatar" className="block mb-2">Foto</Label>
                  <div className="flex items-center gap-2">
                    <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                    <Button type="button" variant="secondary">
                      <Camera className="h-4 w-4 mr-2" /> Trocar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <SettingsStats
              planLabel={planLabel}
              tokensRemaining={profile.tokens_remaining}
              cycleStart={cycleStart}
              cycleEnd={cycleEnd}
              nextReset={nextReset}
            />
            <ModelUsageChart cycleStart={cycleStart} cycleEnd={cycleEnd} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;