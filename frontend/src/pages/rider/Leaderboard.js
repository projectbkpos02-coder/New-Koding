import React, { useState, useEffect } from 'react';
import RiderLayout from '../../components/RiderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Medal, User, Loader2, TrendingUp, RefreshCw, Crown, Award, Star } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function RiderLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getLeaderboard({});
      setLeaderboard(response.data);
      
      // Find my rank
      const myIndex = response.data.findIndex(r => r.rider_id === user?.id);
      if (myIndex !== -1) {
        setMyRank({
          rank: myIndex + 1,
          ...response.data[myIndex]
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const getRankStyle = (index) => {
    switch(index) {
      case 0: return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-glow-accent';
      case 1: return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-md';
      case 2: return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRankBgStyle = (index) => {
    switch(index) {
      case 0: return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200';
      case 1: return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200';
      case 2: return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200';
      default: return 'bg-muted/50';
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5" />;
    if (index === 1) return <Award className="w-5 h-5" />;
    if (index === 2) return <Medal className="w-5 h-5" />;
    return <span className="font-bold">{index + 1}</span>;
  };

  const getPodiumHeight = (position) => {
    switch(position) {
      case 0: return 'h-28';
      case 1: return 'h-20';
      case 2: return 'h-16';
      default: return 'h-12';
    }
  };

  const getPodiumColor = (position) => {
    switch(position) {
      case 0: return 'bg-gradient-to-t from-yellow-400 to-amber-300';
      case 1: return 'bg-gradient-to-t from-gray-300 to-gray-200';
      case 2: return 'bg-gradient-to-t from-orange-400 to-orange-300';
      default: return 'bg-muted';
    }
  };

  return (
    <RiderLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-2 mb-1">
              <Trophy className="w-6 h-6 text-accent" />
              <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
            </div>
            <p className="text-sm text-muted-foreground">Peringkat penjualan rider bulan ini</p>
          </div>
          <Button onClick={fetchLeaderboard} variant="outline" size="sm" disabled={loading} className="hover-lift">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* My Rank Card */}
            {myRank && (
              <Card className="bg-gradient-to-r from-primary via-primary to-primary/80 text-white border-0 shadow-glow overflow-hidden animate-fade-in-up">
                <CardContent className="p-4 relative">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl ${getRankStyle(myRank.rank - 1)} animate-bounce-in`}>
                      {getRankIcon(myRank.rank - 1)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/70">Peringkat Kamu</p>
                      <p className="text-3xl font-bold">#{myRank.rank}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/70">Total Penjualan</p>
                      <p className="text-xl font-bold">{formatCurrency(myRank.total_sales)}</p>
                      <div className="flex items-center justify-end gap-1 text-white/80 text-xs mt-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{myRank.total_transactions} transaksi</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Podium - Top 3 */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-2 pt-8 pb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {/* 2nd Place */}
                <div className="flex flex-col items-center w-24">
                  <div className="relative mb-2">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-300 ${leaderboard[1]?.rider_id === user?.id ? 'ring-4 ring-primary ring-offset-2' : ''}`}>
                      {leaderboard[1]?.avatar_url ? (
                        <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center shadow">
                      <span className="text-xs font-bold text-gray-700">2</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate w-full text-center">{leaderboard[1]?.full_name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(leaderboard[1]?.total_sales || 0)}</p>
                  <div className={`${getPodiumHeight(1)} w-full ${getPodiumColor(1)} rounded-t-lg mt-2 flex items-center justify-center`}>
                    <Award className="w-5 h-5 text-gray-600" />
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center w-28 -mt-4">
                  <div className="relative mb-2">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Crown className="w-6 h-6 text-yellow-500 animate-float" />
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-4 border-yellow-400 ${leaderboard[0]?.rider_id === user?.id ? 'ring-4 ring-primary ring-offset-2' : ''}`}>
                      {leaderboard[0]?.avatar_url ? (
                        <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-yellow-50 flex items-center justify-center">
                          <User className="w-7 h-7 text-yellow-600" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate w-full text-center">{leaderboard[0]?.full_name?.split(' ')[0]}</p>
                  <p className="text-xs text-accent font-medium">{formatCurrency(leaderboard[0]?.total_sales || 0)}</p>
                  <div className={`${getPodiumHeight(0)} w-full ${getPodiumColor(0)} rounded-t-lg mt-2 flex items-center justify-center`}>
                    <Trophy className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center w-24">
                  <div className="relative mb-2">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-4 border-orange-400 ${leaderboard[2]?.rider_id === user?.id ? 'ring-4 ring-primary ring-offset-2' : ''}`}>
                      {leaderboard[2]?.avatar_url ? (
                        <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                          <User className="w-6 h-6 text-orange-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow">
                      <span className="text-xs font-bold text-white">3</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate w-full text-center">{leaderboard[2]?.full_name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(leaderboard[2]?.total_sales || 0)}</p>
                  <div className={`${getPodiumHeight(2)} w-full ${getPodiumColor(2)} rounded-t-lg mt-2 flex items-center justify-center`}>
                    <Medal className="w-5 h-5 text-orange-700" />
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <Card className="border-border/50 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Star className="w-4 h-4 text-accent" />
                  Peringkat Lengkap
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada data penjualan</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((rider, index) => {
                      const isMe = rider.rider_id === user?.id;
                      return (
                        <div
                          key={rider.rider_id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover-lift animate-fade-in-up ${
                            isMe 
                              ? 'bg-primary/10 border-2 border-primary/30' 
                              : index < 3 
                                ? `${getRankBgStyle(index)} border` 
                                : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                          style={{ animationDelay: `${(index + 3) * 50}ms` }}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${getRankStyle(index)}`}>
                            {getRankIcon(index)}
                          </div>
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                            {rider.avatar_url ? (
                              <img src={rider.avatar_url} alt={rider.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate flex items-center gap-2">
                              {rider.full_name}
                              {isMe && (
                                <Badge className="bg-primary/20 text-primary text-[10px] px-1.5">Kamu</Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{rider.total_transactions} transaksi</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-secondary">{formatCurrency(rider.total_sales)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RiderLayout>
  );
}
