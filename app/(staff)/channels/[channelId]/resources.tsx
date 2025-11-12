import ResourceCard from "@/components/resources/ResourceCard";
import SkeletonCard from "@/components/resources/SkeletonCard";
import UploadChooser from "@/components/resources/UploadChooser";
import { showError, showSuccess } from "@/components/ui/toast";
import { selectChannelById } from "@/redux/channels/channels.slice";
import { fetchChannelById, uploadChannelResources } from "@/redux/channels/channels.thunks";
import type { ChannelResource, UploadResourcesBody } from "@/redux/channels/resources.types";
import { CATEGORY_ORDER, detectCategory, ext, prettyCategory } from "@/redux/channels/resources.utils";
import { reset as resetUpload, selectUpload } from "@/redux/upload/upload.slice";
import { uploadSingle } from "@/redux/upload/upload.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toApiResources } from "@/utils/buildApiResources";
import { getMimeFromName } from "@/utils/getMime";
import { normalizeCloudinaryUrl, slugifyFilename } from "@/utils/slugAndCloudinary";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { ChevronLeft, CloudUpload, Link2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ensureHttpUrl(u?: string | null) {
  if (!u) return "";
  const trimmed = u.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("data:") || trimmed.startsWith("file:")) return trimmed;
  return `https://${trimmed}`;
}

// tiny helper to suggest a filename from URL or title
function deriveSafeNameFromUrl(url: string, title?: string) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    const base = (title && title.trim()) || last || u.hostname;
    // ensure has an extension-ish for nicer MIME guessing (optional)
    const guessed = base.includes(".") ? base : `${base}.link`;
    return slugifyFilename(guessed);
  } catch {
    const base = (title && title.trim()) || "link";
    const guessed = base.includes(".") ? base : `${base}.link`;
    return slugifyFilename(guessed);
  }
}

export default function ChannelResourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectChannelById(channelId || ""));
  const upload = useAppSelector(selectUpload);

  const [selection, setSelection] = useState<string | null>(null);
  const [chooser, setChooser] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [actionFor, setActionFor] = useState<ChannelResource | null>(null);

  // New: link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [submittingLink, setSubmittingLink] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingInitial(true);
        await dispatch(fetchChannelById(channelId!)).unwrap();
      } catch {} finally {
        if (mounted) setLoadingInitial(false);
      }
    })();
    return () => {
      mounted = false;
      dispatch(resetUpload());
    };
  }, [channelId, dispatch]);

  const sections = useMemo(() => {
    const list: ChannelResource[] = (channel?.resources as any) || [];
    const bucket = new Map<string, ChannelResource[]>();
    for (const r of list) {
      const cat = detectCategory(r);
      if (!bucket.has(cat)) bucket.set(cat, []);
      bucket.get(cat)!.push(r);
    }
    return CATEGORY_ORDER.map((cat) => ({
      title: prettyCategory(cat),
      data: bucket.get(cat) || [],
    })).filter((s) => s.data.length > 0);
  }, [channel?.resources]);

  const doSaveToDb = async (payload: UploadResourcesBody) => {
    try {
      await dispatch(uploadChannelResources(payload as any)).unwrap();
      showSuccess("Resources added to Project");
      await dispatch(fetchChannelById(channelId!)).unwrap();
    } catch {
      // errors are already toasted in thunk usually; soft-fail here
    }
  };

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    } as any);
    if ((res as any).canceled) return;

    const assets = (res as any).assets || [];
    const staged: Array<{ url: string; name: string; mime?: string; category: "image" }> = [];

    for (const a of assets) {
      const origName = (a as any).fileName || "image.jpg";
      const safeName = slugifyFilename(origName);
      const mime = (a as any).mimeType || getMimeFromName(origName) || "image/jpeg";
      try {
        const up = await dispatch(
          uploadSingle({ uri: (a as any).uri, name: safeName, type: mime })
        ).unwrap();
        const cleanUrl = ensureHttpUrl(normalizeCloudinaryUrl(up.url));
        staged.push({ url: cleanUrl, name: safeName, mime, category: "image" });
      } catch {}
    }
    if (staged.length) {
      await doSaveToDb({ channelId: channelId!, resources: toApiResources(staged) });
    }
  };

  const handlePickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    } as any);
    if ((res as any).canceled) return;

    const files = Array.isArray((res as any).assets) ? (res as any).assets : [res];
    const staged: Array<{ url: string; name: string; mime?: string; category: "document" | "audio" | "other" }> = [];

    for (const f of files as any[]) {
      const origName = f.name || "file";
      const safeName = slugifyFilename(origName);
      const mime = f.mimeType || getMimeFromName(origName) || "application/octet-stream";
      try {
        const up = await dispatch(
          uploadSingle({ uri: f.uri as string, name: safeName, type: mime })
        ).unwrap();
        const cleanUrl = ensureHttpUrl(normalizeCloudinaryUrl(up.url));
        const category =
          mime === "application/pdf" || ext(safeName) === "pdf"
            ? "document"
            : mime.startsWith("audio/")
            ? "audio"
            : "other";
        staged.push({ url: cleanUrl, name: safeName, mime, category });
      } catch {}
    }

    if (staged.length) {
      await doSaveToDb({ channelId: channelId!, resources: toApiResources(staged) });
    }
  };

  // NEW: Add link flow (no upload; we just persist the URL as a resource)
  const handleAddLink = async () => {
    if (submittingLink) return;

    const rawUrl = linkUrl.trim();
    const title = linkTitle.trim();
    if (!rawUrl) {
      showError("Please paste a link.");
      return;
    }

    const normalized = ensureHttpUrl(rawUrl);
    try {
      // basic URL sanity
      // eslint-disable-next-line no-new
      new URL(normalized);
    } catch {
      showError("That doesn’t look like a valid link.");
      return;
    }

    setSubmittingLink(true);
    try {
      const safeName = deriveSafeNameFromUrl(normalized, title);
      const mime = getMimeFromName(safeName) || "text/html"; // best effort
      const guessedExt = ext(safeName);
      const category =
        guessedExt === "pdf"
          ? "document"
          : mime.startsWith("audio/")
          ? "audio"
          : "other"; // treat general web links as "other"

      const staged = [{ url: normalized, name: safeName, mime, category}];
      await doSaveToDb({ channelId: channelId!, resources: toApiResources(staged as any) });

      // reset form & close
      setLinkTitle("");
      setLinkUrl("");
      setShowLinkModal(false);
    } finally {
      setSubmittingLink(false);
    }
  };

  const previewResource = async (r: ChannelResource) => {
    const url = ensureHttpUrl(r.resourceUpload);
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        enableBarCollapsing: true,
        showTitle: true,
        toolbarColor: "#ffffff",
      });
    } catch {
      try {
        await Linking.openURL(url);
      } catch {
        showError("Failed to open preview");
      }
    }
  };

  const copyLink = async (r: ChannelResource) => {
    try {
      const { setStringAsync } = await import("expo-clipboard");
      await setStringAsync(ensureHttpUrl(r.resourceUpload));
      showSuccess("Link copied");
    } catch {}
  };

  const renameResource = async (r: ChannelResource) => {
    Alert.prompt?.(
      "Rename resource",
      "Update the display name (does not change the remote file).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async () => {
            try {
              showSuccess("Name updated");
            } catch {
              showError("Rename failed");
            }
          },
        },
      ],
      "plain-text",
      r.name || ""
    );
  };

  const headerPaddingTop = insets.top + 12;

  // Small inline chooser only for the empty state CTA
  const [emptyChooserOpen, setEmptyChooserOpen] = useState(false);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View style={{ paddingTop: headerPaddingTop }} className="px-4">
        <View className="flex-row items-center mb-1.5">
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center">
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <Text className="flex-1 text-left text-[20px] font-kumbhBold text-gray-900">
            {channel?.name ? `${channel.name} Resources` : "Project Resources"}
          </Text>
          {/* New: quick add link */}
          <Pressable
            onPress={() => setShowLinkModal(true)}
            className="h-9 w-9 rounded-xl items-center justify-center mr-1.5"
            accessibilityLabel="Add link"
          >
            <Link2 size={20} color="#111827" />
          </Pressable>
          <Pressable
            onPress={() => setChooser(true)}
            className="h-9 w-9 rounded-xl items-center justify-center"
            accessibilityLabel="Upload files"
          >
            <CloudUpload size={20} color="#111827" />
          </Pressable>
        </View>
        <View className="h-px bg-gray-200 mt-2" />
      </View>

      {loadingInitial ? (
        <View className="px-4 pt-4 flex-row flex-wrap">
          <SkeletonCard width={170} />
          <SkeletonCard width={170} />
          <SkeletonCard width={170} />
          <SkeletonCard width={170} />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-gray-500 font-kumbh">No resources yet.</Text>

          {!emptyChooserOpen ? (
            <View className="flex-row gap-3 mt-3">
              <Pressable
                onPress={() => setEmptyChooserOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#4C5FAB]"
              >
                <Text className="text-white font-kumbhBold">Add resources</Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-3 w-full max-w-[320px] rounded-2xl border border-gray-200 p-3">
              <Text className="font-kumbhBold mb-2 text-gray-900">Choose action</Text>
              <Pressable
                onPress={() => {
                  setEmptyChooserOpen(false);
                  setChooser(true);
                }}
                className="py-2"
              >
                <Text className="font-kumbh text-gray-800">Upload files (images/docs)</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEmptyChooserOpen(false);
                  setShowLinkModal(true);
                }}
                className="py-2"
              >
                <Text className="font-kumbh text-gray-800">Add a link</Text>
              </Pressable>
              <Pressable onPress={() => setEmptyChooserOpen(false)} className="py-2">
                <Text className="font-kumbh text-gray-500">Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, idx) => (item._id || item.resourceUpload) + ":" + idx}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="px-4 pt-4 pb-2 font-kumbhBold text-gray-900">{title}</Text>
          )}
          renderItem={() => null}
          renderSectionFooter={({ section }) => (
            <View className="px-4">
              <FlatList
                data={section.data}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 8 }}
                keyExtractor={(it, idx) => (it._id || it.resourceUpload) + ":" + idx}
                renderItem={({ item }) => (
                  <ResourceCard
                    item={item}
                    width={0}
                    className="w-[48%]"
                    selected={selection === item._id}
                    onPress={() => {
                      setSelection(selection === item._id ? null : item._id || null);
                      previewResource(item);
                    }}
                    onMenu={() => setActionFor(item)}
                  />
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        />
      )}

      {/* Floating actions */}
      <Pressable
        onPress={() => setChooser(true)}
        className="absolute right-4 bottom-6 h-14 w-14 rounded-full bg-[#4C5FAB] items-center justify-center"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
        accessibilityLabel="Upload files"
      >
        <CloudUpload size={22} color="#fff" />
      </Pressable>

      {/* Keep your existing chooser for files */}
      <UploadChooser
        visible={chooser}
        onClose={() => setChooser(false)}
        onPickImage={handlePickImage}
        onPickDocument={handlePickDocument}
      />

      {/* Simple bottom-sheet style link modal */}
      <Modal visible={showLinkModal} animationType="slide" transparent onRequestClose={() => setShowLinkModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          className="flex-1 justify-end"
        >
          <Pressable className="absolute inset-0 bg-black/30" onPress={() => !submittingLink && setShowLinkModal(false)} />
          <View className="bg-white rounded-t-2xl p-5">
            <Text className="font-kumbhBold text-lg mb-3">Add a link</Text>

            <Text className="font-kumbh text-xs text-gray-500 mb-1">Title (optional)</Text>
            <View className="border border-gray-200 rounded-xl px-3 py-2 mb-3">
              <TextInput
                placeholder="e.g. Project brief"
                value={linkTitle}
                onChangeText={setLinkTitle}
                className="font-kumbh text-gray-900"
                editable={!submittingLink}
              />
            </View>

            <Text className="font-kumbh text-xs text-gray-500 mb-1">URL</Text>
            <View className="border border-gray-200 rounded-xl px-3 py-2">
              <TextInput
                placeholder="https://example.com/doc"
                value={linkUrl}
                onChangeText={setLinkUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                className="font-kumbh text-gray-900"
                editable={!submittingLink}
              />
            </View>

            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => setShowLinkModal(false)}
                disabled={submittingLink}
                className="px-4 py-2 rounded-xl bg-gray-100"
              >
                <Text className="font-kumbh text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddLink}
                disabled={submittingLink}
                className="px-4 py-2 rounded-xl bg-[#4C5FAB]"
              >
                {submittingLink ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" />
                    <Text className="text-white font-kumbh ml-2">Saving…</Text>
                  </View>
                ) : (
                  <Text className="text-white font-kumbhBold">Save link</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {actionFor ? (
        <View className="absolute inset-0 bg-black/30">
          <View className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl p-4">
            <Text className="font-kumbhBold text-base mb-2">Resource options</Text>
            <Pressable
              onPress={() => {
                previewResource(actionFor);
                setActionFor(null);
              }}
              className="py-3"
            >
              <Text className="font-kumbh">Preview</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await copyLink(actionFor);
                setActionFor(null);
              }}
              className="py-3"
            >
              <Text className="font-kumbh">Copy link</Text>
            </Pressable>
            <Pressable onPress={() => setActionFor(null)} className="py-3">
              <Text className="text-gray-500 font-kumbh">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {upload.phase === "uploading" && (
        <View pointerEvents="none" className="absolute left-0 right-0 bottom-[90px] items-center">
          <View className="bg-gray-900 px-4 py-2.5 rounded-xl flex-row items-center">
            <ActivityIndicator color="#fff" />
            <Text className="text-white ml-2 font-kumbh">Uploading… {upload.progress}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}
