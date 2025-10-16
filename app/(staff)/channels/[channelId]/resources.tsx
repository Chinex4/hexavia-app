import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SectionList,
  Text,
  View,
  Alert,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ChevronLeft, CloudDownload, CloudUpload } from "lucide-react-native";
import { fetchChannelById, uploadChannelResources } from "@/redux/channels/channels.thunks";
import { selectChannelById } from "@/redux/channels/channels.slice";
import { uploadSingle } from "@/redux/upload/upload.thunks";
import { selectUpload, reset as resetUpload } from "@/redux/upload/upload.slice";
import SkeletonCard from "@/components/resources/SkeletonCard";
import UploadChooser from "@/components/resources/UploadChooser";
import ResourceCard from "@/components/resources/ResourceCard";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { getMimeFromName } from "@/utils/getMime";
import { showSuccess, showError } from "@/components/ui/toast";
import { toApiResources } from "@/utils/buildApiResources";
import { slugifyFilename, normalizeCloudinaryUrl } from "@/utils/slugAndCloudinary";
import type { ChannelResource, UploadResourcesBody } from "@/redux/channels/resources.types";
import { CATEGORY_ORDER, detectCategory, prettyCategory, ext } from "@/redux/channels/resources.utils";

function ensureHttpUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("data:") || u.startsWith("file:")) return u;
  return `https://${u}`;
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
      showSuccess("Resources added to channel");
      await dispatch(fetchChannelById(channelId!)).unwrap();
    } catch {}
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

  // const downloadResource = async (r: ChannelResource) => {
  //   try {
  //     const fileExt = ext(r.name || r.resourceUpload) || "bin";
  //     const fileName = (r.name && slugifyFilename(r.name)) || `resource.${fileExt}`;
  //     const baseDir : string = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory)!;
  //     const target = `${baseDir}${fileName}`;
  //     const url = ensureHttpUrl(r.resourceUpload);
  //     console.log("Downloading", { url, target });
  //     const { uri } = await FileSystem.downloadAsync(url, target);
  //     if (await Sharing.isAvailableAsync()) {
  //       await Sharing.shareAsync(uri);
  //     } else {
  //       showSuccess("Downloaded to app documents");
  //     }
  //   } catch {
  //     showError("Download failed");
  //   }
  // };

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

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View style={{ paddingTop: headerPaddingTop }} className="px-4">
        <View className="flex-row items-center mb-1.5">
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center">
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <Text className="flex-1 text-left text-[20px] font-kumbhBold text-gray-900">
            {channel?.name ? `${channel.name} Resources` : "Channel Resources"}
          </Text>
          {/* <Pressable onPress={() => {}} className="h-9 w-9 rounded-xl items-center justify-center mr-1.5">
            <CloudDownload size={20} color="#111827" />
          </Pressable> */}
          <Pressable onPress={() => setChooser(true)} className="h-9 w-9 rounded-xl items-center justify-center">
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
          <Pressable onPress={() => setChooser(true)} className="mt-3 px-4 py-2 rounded-xl bg-[#4C5FAB]">
            <Text className="text-white font-kumbhBold">Upload resources</Text>
          </Pressable>
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

      <Pressable
        onPress={() => setChooser(true)}
        className="absolute right-4 bottom-6 h-14 w-14 rounded-full bg-[#4C5FAB] items-center justify-center"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <CloudUpload size={22} color="#fff" />
      </Pressable>

      <UploadChooser
        visible={chooser}
        onClose={() => setChooser(false)}
        onPickImage={handlePickImage}
        onPickDocument={handlePickDocument}
      />

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
            {/* <Pressable
              onPress={async () => {
                await downloadResource(actionFor);
                setActionFor(null);
              }}
              className="py-3"
            >
              <Text className="font-kumbh">Download / Share</Text>
            </Pressable> */}
            <Pressable
              onPress={async () => {
                await copyLink(actionFor);
                setActionFor(null);
              }}
              className="py-3"
            >
              <Text className="font-kumbh">Copy link</Text>
            </Pressable>
            {/* <Pressable
              onPress={async () => {
                await renameResource(actionFor);
                setActionFor(null);
              }}
              className="py-3"
            >
              <Text className="font-kumbh">Rename</Text>
            </Pressable> */}
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
