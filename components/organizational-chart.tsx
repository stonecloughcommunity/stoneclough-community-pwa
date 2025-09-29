import { Users, Heart, Briefcase, Leaf, Monitor, Shield, Crown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrganizationalChart() {
  const departments = [
    {
      id: "faith-culture",
      title: "Faith & Culture",
      icon: Heart,
      color: "bg-purple-100 border-purple-300",
      iconColor: "text-purple-600",
      leads: "Faith Lead (Clergy/Reader) + Culture Lead (Community Rep)",
      outputs: [
        "Devotional content (daily verses, prayers)",
        "Events calendar (services, concerts, heritage walks)",
        "Heritage storytelling (articles, photos, local history)",
      ],
    },
    {
      id: "community-wellbeing",
      title: "Community & Social Wellbeing",
      icon: Users,
      color: "bg-blue-100 border-blue-300",
      iconColor: "text-blue-600",
      leads: "Community Coordinator + Volunteer Lead",
      outputs: [
        "Social events, youth clubs, wellbeing meetups",
        "Help requests / offers board",
        "Wellbeing surveys and feedback loops",
      ],
    },
    {
      id: "economy-enterprise",
      title: "Economy & Enterprise",
      icon: Briefcase,
      color: "bg-amber-100 border-amber-300",
      iconColor: "text-amber-600",
      leads: "Enterprise Mentor + Business Advisor",
      outputs: [
        "Marketplace listings (crafts, produce, local services)",
        "Training/workshop booking system",
        "Profit-sharing dashboards (transparent reporting)",
      ],
    },
    {
      id: "land-sustainability",
      title: "Land, Food & Sustainability",
      icon: Leaf,
      color: "bg-green-100 border-green-300",
      iconColor: "text-green-600",
      leads: "Land Steward + Food Coordinator",
      outputs: [
        "Community garden rota (volunteer sign-ups)",
        "Harvest reports → linked to marketplace",
        "Eco-project updates (composting, renewable energy)",
      ],
    },
    {
      id: "technology-platform",
      title: "Technology & Platform",
      icon: Monitor,
      color: "bg-indigo-100 border-indigo-300",
      iconColor: "text-indigo-600",
      leads: "Tech Steward + Digital Trainer",
      outputs: [
        "App maintenance, upgrades, bug fixes",
        "Digital literacy training for residents",
        "New tools (fundraising, livestreams, digital library)",
      ],
    },
    {
      id: "governance-partnerships",
      title: "Governance, Partnerships & Growth",
      icon: Shield,
      color: "bg-rose-100 border-rose-300",
      iconColor: "text-rose-600",
      leads: "Governance Officer + Partnerships Lead",
      outputs: [
        "Transparency hub (finance, safeguarding, GDPR)",
        "Partnership news (schools, colleges, businesses)",
        "Stoneclough Toolkit (replication package)",
        "Fundraising dashboards (donations, grants)",
      ],
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-green-800">Stoneclough Movement</h1>
        <p className="text-xl text-green-600">Organizational Structure</p>
      </div>

      {/* Movement Council */}
      <div className="flex justify-center">
        <Card className="bg-green-50 border-green-300 shadow-lg max-w-md">
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-2">
              <Crown className="h-8 w-8 text-green-700" />
            </div>
            <CardTitle className="text-green-800">Movement Council</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-green-700 font-medium">Church PCC + Trustees + Community Reps</p>
            <p className="text-xs text-green-600 mt-2 italic">Sets vision, approves strategy, ensures accountability</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Line */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-green-300"></div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const IconComponent = dept.icon
          return (
            <Card key={dept.id} className={`${dept.color} shadow-lg hover:shadow-xl transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-6 w-6 ${dept.iconColor}`} />
                  <CardTitle className="text-lg text-gray-800">{dept.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Leadership:</h4>
                  <p className="text-xs text-gray-600">{dept.leads}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Platform Outputs:</h4>
                  <ul className="space-y-1">
                    {dept.outputs.map((output, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {output}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Platform Hub Section */}
      <div className="mt-12 text-center space-y-4">
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-green-800 mb-4">PWA as Central Hub</h3>
          <p className="text-green-700 leading-relaxed">
            Every department has autonomy in day-to-day work, but <strong>all outputs</strong>
            (events, services, reports, updates) flow <strong>into and through the PWA</strong>, making the platform the
            shared bloodstream of the Stoneclough Movement.
          </p>
        </div>
      </div>

      {/* Key Interconnections */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Key Interconnections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded border">
            <p>
              <strong>Faith & Culture + Community & Social</strong> → Create content → published in{" "}
              <strong>Events & Devotional sections</strong>
            </p>
          </div>
          <div className="bg-white p-4 rounded border">
            <p>
              <strong>Economy & Enterprise + Land & Sustainability</strong> → Manage tangible outputs → flow into{" "}
              <strong>Marketplace & Directory</strong>
            </p>
          </div>
          <div className="bg-white p-4 rounded border">
            <p>
              <strong>Technology</strong> → Keeps all departments functional and interconnected via PWA
            </p>
          </div>
          <div className="bg-white p-4 rounded border">
            <p>
              <strong>Governance</strong> → Oversees compliance + outputs progress reports into a{" "}
              <strong>Transparency Hub</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
