/**
 * Integration Dashboard Widgets
 * Widgets for displaying content from external integrations
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiLinkedin,
  FiMessageCircle,
  FiRss,
  FiGlobe,
  FiRefreshCw,
  FiExternalLink,
  FiClock,
  FiUser,
  FiTrendingUp,
} from "react-icons/fi";
import type {
  BaseIntegration,
  NewsArticle,
  LinkedInPost,
  TelegramMessage,
} from "@/types/external-integrations";

interface IntegrationWidgetProps {
  integration: BaseIntegration;
  onRefresh?: () => void;
}

/**
 * LinkedIn Feed Widget
 */
export function LinkedInFeedWidget({
  integration,
  onRefresh,
}: IntegrationWidgetProps) {
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [integration.id]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/integrations/${integration.id}/data?limit=5`,
      );
      const data = await response.json();

      if (data.success && data.data) {
        setPosts(data.data.posts || data.data || []);
      }
    } catch (error) {
      console.error("Error loading LinkedIn posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <FiLinkedin />
          </div>
          <div>
            <h3 className="font-semibold text-white">LinkedIn Feed</h3>
            <p className="text-xs text-gray-400">{integration.name}</p>
          </div>
        </div>
        <button
          onClick={() => {
            loadPosts();
            onRefresh?.();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiRefreshCw
            className={`text-gray-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FiRefreshCw className="animate-spin text-2xl text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No posts available</p>
          </div>
        ) : (
          posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{post.author}</span>
                <span className="text-xs text-gray-500">
                  {new Date(post.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-white line-clamp-3">{post.text}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {post.likes !== undefined && <span>👍 {post.likes}</span>}
                {post.comments !== undefined && <span>💬 {post.comments}</span>}
                {post.shares !== undefined && <span>↗️ {post.shares}</span>}
              </div>
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  View on LinkedIn <FiExternalLink />
                </a>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Telegram Messages Widget
 */
export function TelegramMessagesWidget({
  integration,
  onRefresh,
}: IntegrationWidgetProps) {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 30 seconds
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [integration.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/integrations/${integration.id}/data?limit=10`,
      );
      const data = await response.json();

      if (data.success && data.data) {
        setMessages(data.data.messages || data.data || []);
      }
    } catch (error) {
      console.error("Error loading Telegram messages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg text-white">
            <FiMessageCircle />
          </div>
          <div>
            <h3 className="font-semibold text-white">Telegram Messages</h3>
            <p className="text-xs text-gray-400">{integration.name}</p>
          </div>
        </div>
        <button
          onClick={() => {
            loadMessages();
            onRefresh?.();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiRefreshCw
            className={`text-gray-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FiRefreshCw className="animate-spin text-2xl text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No messages</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 rounded-lg p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-400 text-sm" />
                  <span className="text-sm text-white font-medium">
                    {message.from?.firstName || "Unknown"}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {message.text && (
                <p className="text-sm text-gray-300">{message.text}</p>
              )}
              {message.mediaUrl && (
                <div className="mt-2">
                  <span className="text-xs text-gray-400">
                    📎 {message.mediaType || "Media"}
                  </span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * News Feed Widget
 */
export function NewsFeedWidget({
  integration,
  onRefresh,
}: IntegrationWidgetProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [integration.id]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/integrations/${integration.id}/data?limit=10`,
      );
      const data = await response.json();

      if (data.success && data.data) {
        setArticles(data.data.articles || data.data || []);
      }
    } catch (error) {
      console.error("Error loading news articles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg text-white">
            <FiRss />
          </div>
          <div>
            <h3 className="font-semibold text-white">News Feed</h3>
            <p className="text-xs text-gray-400">{integration.name}</p>
          </div>
        </div>
        <button
          onClick={() => {
            loadArticles();
            onRefresh?.();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiRefreshCw
            className={`text-gray-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FiRefreshCw className="animate-spin text-2xl text-gray-400" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No articles available</p>
          </div>
        ) : (
          articles.map((article) => (
            <motion.a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="block bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-white line-clamp-2 flex-1">
                  {article.title}
                </h4>
                <FiExternalLink className="text-gray-400 text-sm flex-shrink-0" />
              </div>
              {article.summary && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  {article.source && <span>{article.source}</span>}
                  {article.author && (
                    <span className="flex items-center gap-1">
                      <FiUser className="text-xs" /> {article.author}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1">
                  <FiClock className="text-xs" />
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              </div>
              {article.category && (
                <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                  {article.category}
                </span>
              )}
            </motion.a>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Generic Site Iframe Widget
 */
export function GenericSiteWidget({ integration }: IntegrationWidgetProps) {
  const config = integration.config as any;
  const url = config.url || "";
  const iframeConfig = config.iframeConfig || {};

  if (!url) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex items-center justify-center h-full">
        <p className="text-gray-400">No URL configured</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500 p-2 rounded-lg text-white">
            <FiGlobe />
          </div>
          <div>
            <h3 className="font-semibold text-white">Embedded Site</h3>
            <p className="text-xs text-gray-400">{integration.name}</p>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiExternalLink className="text-gray-400" />
        </a>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border border-white/10">
        <iframe
          src={url}
          className="w-full h-full border-0"
          style={{
            width: iframeConfig.width || "100%",
            height: iframeConfig.height || "100%",
            minHeight: "400px",
          }}
          allowFullScreen={iframeConfig.allowFullscreen !== false}
          sandbox={
            iframeConfig.sandbox?.join(" ") ||
            "allow-same-origin allow-scripts allow-forms"
          }
          title={integration.name}
        />
      </div>
    </div>
  );
}

/**
 * Integration Widget Router
 * Routes to appropriate widget based on integration type
 */
export function IntegrationWidget({
  integration,
  onRefresh,
}: IntegrationWidgetProps) {
  switch (integration.type) {
    case "LINKEDIN":
      return (
        <LinkedInFeedWidget integration={integration} onRefresh={onRefresh} />
      );
    case "TELEGRAM":
      return (
        <TelegramMessagesWidget
          integration={integration}
          onRefresh={onRefresh}
        />
      );
    case "WHATSAPP":
      return (
        <TelegramMessagesWidget
          integration={integration}
          onRefresh={onRefresh}
        />
      );
    case "NEWS_SITE":
    case "RSS_FEED":
      return <NewsFeedWidget integration={integration} onRefresh={onRefresh} />;
    case "GENERIC_SITE":
    case "IFRAME_EMBED":
      return (
        <GenericSiteWidget integration={integration} onRefresh={onRefresh} />
      );
    default:
      return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex items-center justify-center h-full">
          <p className="text-gray-400">
            Widget not available for this integration type
          </p>
        </div>
      );
  }
}
