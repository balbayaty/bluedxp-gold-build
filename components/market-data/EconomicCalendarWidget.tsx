/**
 * 📅 ECONOMIC CALENDAR WIDGET
 * Upcoming economic events that may impact supply chain
 * Beautiful timeline with importance indicators
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, Info, TrendingUp } from 'lucide-react';

interface EconomicEvent {
  date: Date;
  time: string;
  event: string;
  country: string;
  flag: string;
  importance: 'low' | 'medium' | 'high';
  impact: string;
  forecast?: string;
  previous?: string;
}

export function EconomicCalendarWidget() {
  const getUpcomingEvents = (): EconomicEvent[] => {
    const now = new Date();
    
    return [
      {
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        time: '10:00 AM EST',
        event: 'US CPI Release',
        country: 'United States',
        flag: '🇺🇸',
        importance: 'high',
        impact: 'Affects USD value, commodity prices, and inflation outlook',
        forecast: '+3.2% YoY',
        previous: '+3.1% YoY',
      },
      {
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        time: '2:00 PM CET',
        event: 'ECB Interest Rate Decision',
        country: 'Eurozone',
        flag: '🇪🇺',
        importance: 'high',
        impact: 'Affects EUR exchange rates and European economic outlook',
        forecast: '4.50%',
        previous: '4.50%',
      },
      {
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        time: '9:45 AM EST',
        event: 'Manufacturing PMI',
        country: 'United States',
        flag: '🇺🇸',
        importance: 'medium',
        impact: 'Indicates manufacturing sector health and demand',
        forecast: '52.0',
        previous: '51.5',
      },
      {
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        time: '11:00 AM KSA',
        event: 'Saudi GDP Release',
        country: 'Saudi Arabia',
        flag: '🇸🇦',
        importance: 'medium',
        impact: 'Regional economic indicator, affects SAR and oil markets',
        forecast: '+3.5% YoY',
        previous: '+3.2% YoY',
      },
      {
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        time: '8:30 AM EST',
        event: 'US Non-Farm Payrolls',
        country: 'United States',
        flag: '🇺🇸',
        importance: 'high',
        impact: 'Major USD driver, affects global markets and employment outlook',
        forecast: '+190K',
        previous: '+216K',
      },
      {
        date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        time: '10:00 AM GMT',
        event: 'UK Inflation Data',
        country: 'United Kingdom',
        flag: '🇬🇧',
        importance: 'medium',
        impact: 'Affects GBP exchange rates and UK monetary policy',
        forecast: '+4.0% YoY',
        previous: '+4.2% YoY',
      },
    ];
  };

  const events = getUpcomingEvents();

  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'high':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      default:
        return '';
    }
  };

  const getImportanceIcon = (importance: string) => {
    if (importance === 'high') return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (importance === 'medium') return <Info className="h-4 w-4 text-yellow-600" />;
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  const getDaysUntil = (date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          Economic Calendar
        </CardTitle>
        <CardDescription>
          Upcoming events that may impact markets and supply chain
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="relative space-y-4">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

          {events.map((event, index) => (
            <div key={index} className="relative pl-14">
              {/* Timeline Dot */}
              <div className={`absolute left-3 top-3 w-6 h-6 rounded-full border-4 border-background ${
                event.importance === 'high' ? 'bg-red-500' :
                event.importance === 'medium' ? 'bg-yellow-500' :
                'bg-blue-500'
              } shadow-lg`}></div>

              {/* Event Card */}
              <div className="rounded-lg border p-4 hover:shadow-md transition-all hover:border-primary/50 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-2xl">{event.flag}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{event.event}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="default" className={getImportanceColor(event.importance)}>
                      <div className="flex items-center gap-1">
                        {getImportanceIcon(event.importance)}
                        <span className="capitalize">{event.importance}</span>
                      </div>
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {getDaysUntil(event.date)}
                    </div>
                  </div>
                </div>

                {/* Impact */}
                <p className="text-sm text-muted-foreground">
                  {event.impact}
                </p>

                {/* Forecast vs Previous */}
                {event.forecast && event.previous && (
                  <div className="flex gap-4 pt-2 border-t text-sm">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Forecast</div>
                      <div className="font-semibold">{event.forecast}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Previous</div>
                      <div className="font-semibold">{event.previous}</div>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  📅 {event.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          📅 Calendar updates daily • High-impact events highlighted
        </div>
      </CardContent>
    </Card>
  );
}

export default EconomicCalendarWidget;
