import { useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { Settings, Shield, Bell, Clock, MapPin, Database, ExternalLink } from "lucide-react";

const CONFIG = [
  {
    group: "System Settings",
    items: [
      { key: "server_mode", label: "Server Mode", value: "LOCAL", type: "info", icon: Database },
      { key: "ai_engine", label: "AI Assessment Engine", value: "Local NLP", type: "info", icon: Shield },
      { key: "encryption", label: "Data Encryption", value: "AES-256", type: "info", icon: Shield },
    ],
  },
  {
    group: "Notification Settings",
    items: [
      { key: "critical_alerts", label: "Critical Alerts", value: "Enabled", type: "toggle", icon: Bell, on: true },
      { key: "sla_reminders", label: "SLA Reminders", value: "Enabled", type: "toggle", icon: Clock, on: true },
      { key: "geotag_updates", label: "Geotag Updates", value: "Enabled", type: "toggle", icon: MapPin, on: true },
      { key: "officer_notifications", label: "Officer Notifications", value: "Disabled", type: "toggle", icon: ExternalLink, on: false },
    ],
  },
  {
    group: "Access Control",
    items: [
      { key: "rbac", label: "RBAC Enabled", value: "Role-Based Access", type: "info", icon: Shield },
      { key: "dpdp_compliance", label: "DPDP Compliance", value: "Active", type: "info", icon: Database },
      { key: "caste_cert_access", label: "Caste Certificate Access", value: "Officer Only", type: "info", icon: Shield },
    ],
  },
];

export default function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState<string>("System Settings");
  const [settings, setSettings] = useState<Record<string, any>>({});

  const groupNames = CONFIG.map((g) => g.group);
  const activeConfig = CONFIG.find((c) => c.group === activeGroup);

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <Settings size={20} className="text-navy-700" /> Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure RAAHAT system parameters, notification preferences, and access control.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Group Nav */}
          <nav className="lg:col-span-3">
            <div className="space-y-1">
              {groupNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveGroup(name)}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-all
                    ${activeGroup === name ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-navy-800"}
                  `}
                >
                  {name}
                </button>
              ))}
            </div>
          </nav>

          {/* Settings Form */}
          <div className="lg:col-span-9">
            {activeConfig && (
              <div className="bg-white border border-slate-200 rounded shadow-xs">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-navy-900 text-sm">{activeGroup}</h2>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {activeConfig.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <Icon size={16} className="text-slate-400" />
                            <div>
                              <div className="text-sm font-medium text-navy-900">{item.label}</div>
                              {item.type === "info" && (
                                <div className="text-xs text-slate-500">{item.value}</div>
                              )}
                            </div>
                          </div>
                          {item.type === "toggle" ? (
                            <button
                              onClick={() => setSettings({ ...settings, [item.key]: !item.on })}
                              className={`relative inline-flex items-center px-0.5 w-10 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-navy-400 ${item.on ? "bg-navy-900" : "bg-slate-300"}`}
                            >
                              <div
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${item.on ? "translate-x-5" : "translate-x-0.5"}`}
                              />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm border border-slate-300 text-slate-600 rounded hover:bg-slate-100">
                Cancel
              </button>
              <button className="px-5 py-2 text-sm font-semibold text-white bg-navy-900 rounded hover:bg-navy-800">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* System Health Footer */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="text-xs text-slate-500 mb-2">System Health</div>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-safe-700 rounded-full" />
              <span>Database: Connected (PostgreSQL)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-safe-700 rounded-full" />
              <span>Authentication: Active (JWT)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-safe-700 rounded-full" />
              <span>ML Engine: Local NLP (131 patterns loaded)</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}