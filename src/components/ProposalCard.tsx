"use client";

interface Proposal {
    tagline: string;
    bannerConcept: string;
    jingleMood: string;
    videoScene: string;
    voiceoverScript: string;
    voiceTone: string;
}

interface ProposalCardProps {
    proposal: Proposal;
    colors: string[];
}

export default function ProposalCard({ proposal, colors }: ProposalCardProps) {
    return (
        <div className="space-y-6">
            {/* Tagline */}
            <div className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
                <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-2">Tagline</p>
                <p className="text-xl sm:text-3xl font-bold text-white">&ldquo;{proposal.tagline}&rdquo;</p>
            </div>

            {/* Color palette */}
            {colors.length > 0 && (
                <div className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
                    <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-3">Color Palette</p>
                    <div className="flex gap-3">
                        {colors.map((color) => (
                            <div key={color} className="flex flex-col items-center gap-1">
                                <div
                                    className="w-10 h-10 rounded-lg ring-1 ring-white/20"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-xs text-white/40">{color}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid of brief items */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Section label="Banner Concept" value={proposal.bannerConcept} />
                <Section label="Jingle Mood" value={proposal.jingleMood} />
                <Section label="Video Scene" value={proposal.videoScene} />
                <Section label="Voiceover Script" value={proposal.voiceoverScript} />
            </div>
        </div>
    );
}

function Section({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-2">{label}</p>
            <p className="text-sm text-white/80 leading-relaxed">{value}</p>
        </div>
    );
}
