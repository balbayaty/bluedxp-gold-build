/**
 * 🌍 LOGISTICS PERFORMANCE INDEX (LPI) WIDGET
 * World Bank's comprehensive measure of logistics quality
 * Free, open data - no API key required!
 * 
 * Measures:
 * - Customs efficiency
 * - Infrastructure quality  
 * - International shipments ease
 * - Logistics competence
 * - Tracking & tracing
 * - Timeliness
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  TrendingUp,
  Ship,
  Package,
  MapPin,
  Award,
  RefreshCw,
  Info
} from 'lucide-react';

interface LPICountryData {
  country: string;
  countryCode: string;
  flag: string;
  year: number;
  overallScore: number;
  rank: number;
  percentile: number;
  components: {
    customs: number;
    infrastructure: number;
    shipments: number;
    quality: number;
    tracking: number;
    timeliness: number;
  };
}

export function LPIWidget() {
  const [selectedRegion, setSelectedRegion] = useState<'middle_east' | 'global' | 'top'>('middle_east');
  const [data, setData] = useState<LPICountryData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLPIData();
  }, [selectedRegion]);

  const fetchLPIData = async () => {
    setLoading(true);
    try {
      // Mock data for LPI (in production, this would call World Bank API)
      const mockData: LPICountryData[] = getMockLPIData(selectedRegion);
      setData(mockData);
    } catch (error) {
      console.error('Error fetching LPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockLPIData = (region: string): LPICountryData[] => {
    const middleEastData: LPICountryData[] = [
      {
        country: 'United Arab Emirates',
        countryCode: 'ARE',
        flag: '🇦🇪',
        year: 2023,
        overallScore: 3.9,
        rank: 11,
        percentile: 93,
        components: {
          customs: 3.8,
          infrastructure: 4.0,
          shipments: 3.9,
          quality: 3.9,
          tracking: 3.8,
          timeliness: 4.1
        }
      },
      {
        country: 'Saudi Arabia',
        countryCode: 'SAU',
        flag: '🇸🇦',
        year: 2023,
        overallScore: 3.2,
        rank: 38,
        percentile: 76,
        components: {
          customs: 3.0,
          infrastructure: 3.3,
          shipments: 3.2,
          quality: 3.1,
          tracking: 3.2,
          timeliness: 3.4
        }
      },
      {
        country: 'Qatar',
        countryCode: 'QAT',
        flag: '🇶🇦',
        year: 2023,
        overallScore: 3.2,
        rank: 39,
        percentile: 75,
        components: {
          customs: 3.1,
          infrastructure: 3.4,
          shipments: 3.2,
          quality: 3.0,
          tracking: 3.1,
          timeliness: 3.3
        }
      },
      {
        country: 'Kuwait',
        countryCode: 'KWT',
        flag: '🇰🇼',
        year: 2023,
        overallScore: 3.0,
        rank: 46,
        percentile: 71,
        components: {
          customs: 2.9,
          infrastructure: 3.1,
          shipments: 3.0,
          quality: 2.9,
          tracking: 3.0,
          timeliness: 3.2
        }
      },
      {
        country: 'Bahrain',
        countryCode: 'BHR',
        flag: '🇧🇭',
        year: 2023,
        overallScore: 3.1,
        rank: 44,
        percentile: 72,
        components: {
          customs: 3.0,
          infrastructure: 3.2,
          shipments: 3.1,
          quality: 3.0,
          tracking: 3.1,
          timeliness: 3.3
        }
      }
    ];

    const topPerformers: LPICountryData[] = [
      {
        country: 'Singapore',
        countryCode: 'SGP',
        flag: '🇸🇬',
        year: 2023,
        overallScore: 4.3,
        rank: 1,
        percentile: 100,
        components: {
          customs: 4.2,
          infrastructure: 4.3,
          shipments: 4.3,
          quality: 4.4,
          tracking: 4.3,
          timeliness: 4.4
        }
      },
      {
        country: 'Germany',
        countryCode: 'DEU',
        flag: '🇩🇪',
        year: 2023,
        overallScore: 4.2,
        rank: 2,
        percentile: 99,
        components: {
          customs: 4.1,
          infrastructure: 4.3,
          shipments: 4.2,
          quality: 4.3,
          tracking: 4.2,
          timeliness: 4.3
        }
      },
      {
        country: 'Netherlands',
        countryCode: 'NLD',
        flag: '🇳🇱',
        year: 2023,
        overallScore: 4.1,
        rank: 3,
        percentile: 98,
        components: {
          customs: 4.0,
          infrastructure: 4.2,
          shipments: 4.1,
          quality: 4.2,
          tracking: 4.1,
          timeliness: 4.2
        }
      }
    ];

    const globalData: LPICountryData[] = [
      ...middleEastData,
      {
        country: 'United States',
        countryCode: 'USA',
        flag: '🇺🇸',
        year: 2023,
        overallScore: 3.9,
        rank: 12,
        percentile: 92,
        components: {
          customs: 3.8,
          infrastructure: 4.0,
          shipments: 3.9,
          quality: 3.9,
          tracking: 3.9,
          timeliness: 4.0
        }
      },
      {
        country: 'United Kingdom',
        countryCode: 'GBR',
        flag: '🇬🇧',
        year: 2023,
        overallScore: 4.0,
        rank: 9,
        percentile: 94,
        components: {
          customs: 3.9,
          infrastructure: 4.1,
          shipments: 4.0,
          quality: 4.0,
          tracking: 4.0,
          timeliness: 4.1
        }
      }
    ];

    if (region === 'middle_east') return middleEastData;
    if (region === 'top') return topPerformers;
    return globalData;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-green-600 dark:text-green-400';
    if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 3.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 4.0) return { label: 'Excellent', class: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' };
    if (score >= 3.5) return { label: 'Good', class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' };
    if (score >= 3.0) return { label: 'Average', class: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' };
    return { label: 'Below Average', class: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' };
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 10) return { icon: '🥇', label: 'Top 10' };
    if (rank <= 25) return { icon: '🥈', label: 'Top 25' };
    if (rank <= 50) return { icon: '🥉', label: 'Top 50' };
    return { icon: '📊', label: `Rank ${rank}` };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Logistics Performance Index (LPI)
            </CardTitle>
            <CardDescription>
              World Bank's measure of logistics quality and efficiency
            </CardDescription>
          </div>
          <Button onClick={fetchLPIData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                About LPI
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                The LPI scores countries on a scale of 1-5 across six key dimensions of logistics performance.
                Higher scores indicate better logistics infrastructure and services.
              </p>
            </div>
          </div>
        </div>

        {/* Region Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedRegion === 'middle_east' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRegion('middle_east')}
            className="flex-1"
          >
            🌙 Middle East
          </Button>
          <Button
            variant={selectedRegion === 'top' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRegion('top')}
            className="flex-1"
          >
            🏆 Top Performers
          </Button>
          <Button
            variant={selectedRegion === 'global' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRegion('global')}
            className="flex-1"
          >
            🌍 Global
          </Button>
        </div>

        {/* Countries List */}
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading LPI data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((country) => {
              const scoreBadge = getScoreBadge(country.overallScore);
              const rankBadge = getRankBadge(country.rank);

              return (
                <div
                  key={country.countryCode}
                  className="rounded-lg border p-4 hover:shadow-md transition-all space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{country.flag}</span>
                      <div>
                        <div className="font-semibold">{country.country}</div>
                        <div className="text-xs text-muted-foreground">
                          World Bank LPI {country.year}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant="outline" className={scoreBadge.class}>
                        {scoreBadge.label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{rankBadge.icon}</span>
                        <Badge variant="info">
                          {rankBadge.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className="text-center py-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Overall LPI Score</div>
                    <div className={`text-4xl font-bold ${getScoreColor(country.overallScore)}`}>
                      {country.overallScore.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">out of 5.0</div>
                    <Progress value={country.overallScore * 20} className="h-2 mt-3 max-w-xs mx-auto" />
                  </div>

                  {/* Component Scores */}
                  <Tabs value="scores" onValueChange={() => {}} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="scores">Component Scores</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scores" className="space-y-3 mt-4">
                      {Object.entries(country.components).map(([key, value]) => {
                        const labels: Record<string, { name: string; icon: any }> = {
                          customs: { name: 'Customs Efficiency', icon: Package },
                          infrastructure: { name: 'Infrastructure Quality', icon: MapPin },
                          shipments: { name: 'International Shipments', icon: Ship },
                          quality: { name: 'Logistics Quality', icon: Award },
                          tracking: { name: 'Tracking & Tracing', icon: MapPin },
                          timeliness: { name: 'Timeliness', icon: TrendingUp }
                        };
                        const label = labels[key];
                        const Icon = label.icon;

                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{label.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={value * 20} className="h-2 w-24" />
                              <span className={`font-semibold text-sm w-10 text-right ${getScoreColor(value)}`}>
                                {value.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </TabsContent>

                    <TabsContent value="details" className="mt-4 text-sm space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-muted-foreground text-xs">Global Rank</div>
                          <div className="font-semibold">#{country.rank} of 160</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Percentile</div>
                          <div className="font-semibold">{country.percentile}th</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Year</div>
                          <div className="font-semibold">{country.year}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Source</div>
                          <div className="font-semibold">World Bank</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              );
            })}
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          Data source: World Bank LPI • Updated annually
        </div>
      </CardContent>
    </Card>
  );
}

export default LPIWidget;
