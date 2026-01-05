import ResourceCard from "@/components/resources/ResourceCard";
import SkeletonCard from "@/components/resources/SkeletonCard";
import UploadChooser from "@/components/resources/UploadChooser";
import TabBar from "@/components/channels/TabBar";
import LinkList from "@/components/channels/LinkList";
import NoteList from "@/components/channels/NoteList";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { showError, showSuccess } from "@/components/ui/toast";
import { selectChannelById } from "@/redux/channels/channels.slice";
import {
  fetchChannelById,
  uploadChannelResources,
} from "@/redux/channels/channels.thunks";
import type {
  ChannelResource,
  UploadResourcesBody,
} from "@/redux/channels/resources.types";
import {
  CATEGORY_ORDER,
  detectCategory,
  ext,
  prettyCategory,
} from "@/redux/channels/resources.utils";
import {
  clearLinksForChannel,
  selectChannelLinks,
  selectChannelLinksStatus,
} from "@/redux/channelLinks/channelLinks.slice";
import {
  createChannelLink,
  deleteChannelLink,
  fetchChannelLinks,
  updateChannelLink,
} from "@/redux/channelLinks/channelLinks.thunks";
import type { ChannelLink } from "@/redux/channelLinks/channelLinks.types";
import {
  clearNotesForChannel,
  selectChannelNotes,
  selectChannelNotesStatus,
} from "@/redux/channelNotes/channelNotes.slice";
import {
  createChannelNote,
  deleteChannelNote,
  fetchChannelNotes,
  updateChannelNote,
} from "@/redux/channelNotes/channelNotes.thunks";
import type { ChannelNote } from "@/redux/channelNotes/channelNotes.types";
import {
  reset as resetUpload,
  selectUpload,
} from "@/redux/upload/upload.slice";
import { uploadSingle } from "@/redux/upload/upload.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toApiResources } from "@/utils/buildApiResources";
import { getMimeFromName } from "@/utils/getMime";
import {
  normalizeCloudinaryUrl,
  slugifyFilename,
} from "@/utils/slugAndCloudinary";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { ChevronLeft, CloudUpload, Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabView } from "react-native-tab-view";
import { useWindowDimensions } from "react-native";

function ensureHttpUrl(u?: string | null) {
  if (!u) return "";
  const trimmed = u.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("data:") || trimmed.startsWith("file:"))
    return trimmed;
  return `https://${trimmed}`;
}

const TABS = [
  { id: "resources", label: "Resources" },
  { id: "links", label: "Links" },
  { id: "notes", label: "Notes" },
] as const;

type ChannelTab = (typeof TABS)[number]["id"];
const SWIPE_THRESHOLD = 60;

export default function ChannelResourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectChannelById(channelId || ""));
  const upload = useAppSelector(selectUpload);
  const links = useAppSelector(selectChannelLinks(channelId || ""));
  const linksStatus = useAppSelector(selectChannelLinksStatus(channelId || ""));
  const notes = useAppSelector(selectChannelNotes(channelId || ""));
  const notesStatus = useAppSelector(selectChannelNotesStatus(channelId || ""));

  const [selection, setSelection] = useState<string | null>(null);
  const [chooser, setChooser] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [actionFor, setActionFor] = useState<ChannelResource | null>(null);
  const [emptyChooserOpen, setEmptyChooserOpen] = useState(false);
  const layout = useWindowDimensions();

  const routes = useMemo(
    () => TABS.map((t) => ({ key: t.id, title: t.label })),
    []
  );

  const [index, setIndex] = useState(0);

  const activeTab = routes[index]?.key as ChannelTab;

  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkForm, setLinkForm] = useState({
    title: "",
    url: "",
    description: "",
  });
  const [editingLink, setEditingLink] = useState<ChannelLink | null>(null);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<ChannelLink | null>(null);

  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", description: "" });
  const [editingNote, setEditingNote] = useState<ChannelNote | null>(null);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<ChannelNote | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!channelId) return;
      try {
        setLoadingInitial(true);
        await dispatch(fetchChannelById(channelId)).unwrap();
      } catch {
      } finally {
        if (mounted) setLoadingInitial(false);
      }
    })();
    return () => {
      mounted = false;
      dispatch(resetUpload());
    };
  }, [channelId, dispatch]);

  useEffect(() => {
    if (!channelId) return;
    dispatch(fetchChannelLinks(channelId));
    dispatch(fetchChannelNotes(channelId));
    return () => {
      dispatch(clearLinksForChannel(channelId));
      dispatch(clearNotesForChannel(channelId));
    };
  }, [channelId, dispatch]);

  useEffect(() => {
    if (activeTab !== "resources") {
      setChooser(false);
      setEmptyChooserOpen(false);
      setActionFor(null);
    }
  }, [activeTab]);

  const sections = useMemo(() => {
    const list: ChannelResource[] = (channel?.resources as any) || [];

    const toMs = (v: any) => {
      if (!v) return 0;
      const t =
        typeof v === "string" || typeof v === "number"
          ? new Date(v).getTime()
          : 0;
      return Number.isFinite(t) ? t : 0;
    };

    const sorted = [...list].sort((a: any, b: any) => {
      const aMs = toMs((a as any).createdAt);
      const bMs = toMs((b as any).createdAt);
      return bMs - aMs;
    });

    const bucket = new Map<string, ChannelResource[]>();
    for (const r of sorted) {
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
    } catch (error) {
      console.log("Failed to save resources to DB", error);
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
    const staged: Array<{
      url: string;
      name: string;
      mime?: string;
      category: "image";
      publicId?: string;
    }> = [];

    for (const a of assets) {
      const origName = (a as any).fileName || "image.jpg";
      const safeName = slugifyFilename(origName);
      const mime =
        (a as any).mimeType || getMimeFromName(origName) || "image/jpeg";
      try {
        const up = await dispatch(
          uploadSingle({ uri: (a as any).uri, name: safeName, type: mime })
        ).unwrap();
        const cleanUrl = ensureHttpUrl(normalizeCloudinaryUrl(up.url));
        staged.push({
          url: cleanUrl,
          name: safeName,
          mime,
          category: "image",
          publicId: up.publicId ?? safeName,
        });
      } catch (error) {
        console.log("Failed to upload image", error);
      }
    }
    if (staged.length) {
      await doSaveToDb({
        channelId: channelId!,
        resources: toApiResources(staged),
      });
    }
  };

  const handlePickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    } as any);
    if ((res as any).canceled) return;

    const files = Array.isArray((res as any).assets)
      ? (res as any).assets
      : [res];
    const staged: Array<{
      url: string;
      name: string;
      mime?: string;
      category: "document" | "audio" | "other";
      publicId?: string;
    }> = [];

    for (const f of files as any[]) {
      const origName = f.name || "file";
      const safeName = slugifyFilename(origName);
      const mime =
        f.mimeType || getMimeFromName(origName) || "application/octet-stream";
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
        staged.push({
          url: cleanUrl,
          name: safeName,
          mime,
          category,
          publicId: up.publicId ?? safeName,
        });
      } catch {}
    }

    if (staged.length) {
      await doSaveToDb({
        channelId: channelId!,
        resources: toApiResources(staged),
      });
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

  const openSharedLink = async (rawUrl: string) => {
    const url = ensureHttpUrl(rawUrl);
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
        showError("Failed to open link");
      }
    }
  };

  const handleDeleteLink = async () => {
    if (!channelId || !linkToDelete) return;
    try {
      await dispatch(
        deleteChannelLink({
          channelId,
          linkId: linkToDelete._id,
        })
      ).unwrap();
    } finally {
      setLinkToDelete(null);
    }
  };

  const handleDeleteNote = async () => {
    if (!channelId || !noteToDelete) return;
    try {
      await dispatch(
        deleteChannelNote({
          channelId,
          noteId: noteToDelete._id,
        })
      ).unwrap();
    } finally {
      setNoteToDelete(null);
    }
  };

  const handleSaveLink = async () => {
    if (!channelId || linkSubmitting) return;
    const rawUrl = linkForm.url.trim();
    if (!rawUrl) {
      showError("Please paste a link.");
      return;
    }
    const normalized = ensureHttpUrl(rawUrl);
    try {
      // eslint-disable-next-line no-new
      new URL(normalized);
    } catch {
      showError("That doesn’t look like a valid link.");
      return;
    }

    const trimmedTitle = linkForm.title.trim();
    const trimmedDescription = linkForm.description.trim();
    const payload = {
      channelId,
      title: trimmedTitle || null,
      url: normalized,
      description: trimmedDescription || null,
    };

    setLinkSubmitting(true);
    try {
      if (editingLink) {
        await dispatch(
          updateChannelLink({
            channelId,
            linkId: editingLink._id,
            title: payload.title,
            url: payload.url,
            description: payload.description,
          })
        ).unwrap();
      } else {
        await dispatch(createChannelLink(payload)).unwrap();
      }
      closeLinkModal();
    } finally {
      setLinkSubmitting(false);
    }
  };

  const closeLinkModal = () => {
    setLinkModalVisible(false);
    setEditingLink(null);
    setLinkForm({ title: "", url: "", description: "" });
  };

  const openLinkModal = (link?: ChannelLink) => {
    if (link) {
      setEditingLink(link);
      setLinkForm({
        title: link.title ?? "",
        url: link.url,
        description: link.description ?? "",
      });
    } else {
      setEditingLink(null);
      setLinkForm({ title: "", url: "", description: "" });
    }
    setLinkModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!channelId || noteSubmitting) return;
    const title = noteForm.title.trim();
    if (!title) {
      showError("Give the note a title.");
      return;
    }

    setNoteSubmitting(true);
    try {
      if (editingNote) {
        await dispatch(
          updateChannelNote({
            channelId,
            noteId: editingNote._id,
            title,
            description: noteForm.description.trim() || "",
          })
        ).unwrap();
      } else {
        await dispatch(
          createChannelNote({
            channelId,
            title,
            description: noteForm.description.trim() || "",
          })
        ).unwrap();
      }
      closeNoteModal();
    } finally {
      setNoteSubmitting(false);
    }
  };

  const closeNoteModal = () => {
    setNoteModalVisible(false);
    setEditingNote(null);
    setNoteForm({ title: "", description: "" });
  };

  const openNoteModal = (note?: ChannelNote) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({
        title: note.title || "",
        description: note.description || "",
      });
    } else {
      setEditingNote(null);
      setNoteForm({ title: "", description: "" });
    }
    setNoteModalVisible(true);
  };

  const headerPaddingTop = insets.top + 12;

  const isLinksLoading = linksStatus === "loading";
  const isNotesLoading = notesStatus === "loading";

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View style={{ paddingTop: headerPaddingTop }} className="px-4">
        <View className="flex-row items-center mb-1.5">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center"
          >
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <Text className="flex-1 text-left text-[20px] font-kumbhBold text-gray-900">
            {channel?.name ? `${channel.name} Resources` : "Project Resources"}
          </Text>
          {activeTab === "resources" ? (
            <Pressable
              onPress={() => setChooser(true)}
              className="h-9 w-9 rounded-xl items-center justify-center"
              accessibilityLabel="Upload files"
            >
              <CloudUpload size={20} color="#111827" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() =>
                activeTab === "links" ? openLinkModal() : openNoteModal()
              }
              className="ml-2 flex-row items-center gap-1 rounded-xl bg-[#4C5FAB] px-3 py-2"
            >
              <Plus size={16} color="#fff" />
              <Text className="text-xs font-kumbhBold text-white">
                {activeTab === "links" ? "Add link" : "Add note"}
              </Text>
            </Pressable>
          )}
        </View>
        <TabBar
          tabs={TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onChange={(tabId) => {
            const idx = routes.findIndex((r) => r.key === tabId);
            if (idx >= 0) setIndex(idx);
          }}
        />
      </View>
      <View className="h-px bg-gray-200" />

      {/* Swipeable content */}
      <TabView
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled
        lazy
        renderTabBar={() => null} // we already render your TabBar above
        renderScene={({ route }) => {
          if (route.key === "resources") {
            return (
              <View className="flex-1">
                {loadingInitial ? (
                  <View className="px-4 pt-4 flex-row flex-wrap">
                    <SkeletonCard width={170} />
                    <SkeletonCard width={170} />
                    <SkeletonCard width={170} />
                    <SkeletonCard width={170} />
                  </View>
                ) : sections.length === 0 ? (
                  <View className="flex-1 items-center justify-center p-6">
                    <Text className="text-gray-500 font-kumbh">
                      No resources yet.
                    </Text>

                    {!emptyChooserOpen ? (
                      <View className="flex-row gap-3 mt-3">
                        <Pressable
                          onPress={() => setEmptyChooserOpen(true)}
                          className="px-4 py-2 rounded-xl bg-[#4C5FAB]"
                        >
                          <Text className="text-white font-kumbhBold">
                            Add resources
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View className="mt-3 w-full max-w-[320px] rounded-2xl border border-gray-200 p-3">
                        <Text className="font-kumbhBold mb-2 text-gray-900">
                          Choose action
                        </Text>
                        <Pressable
                          onPress={() => {
                            setEmptyChooserOpen(false);
                            setChooser(true);
                          }}
                          className="py-2"
                        >
                          <Text className="font-kumbh text-gray-800">
                            Upload files (images/docs)
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setEmptyChooserOpen(false);
                            openLinkModal();
                          }}
                          className="py-2"
                        >
                          <Text className="font-kumbh text-gray-800">
                            Add a link
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setEmptyChooserOpen(false)}
                          className="py-2"
                        >
                          <Text className="font-kumbh text-gray-500">
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : (
                  <SectionList
                    sections={sections}
                    keyExtractor={(item, idx) =>
                      (item._id || item.resourceUpload) + ":" + idx
                    }
                    renderSectionHeader={({ section: { title } }) => (
                      <Text className="px-4 pt-4 pb-2 font-kumbhBold text-gray-900">
                        {title}
                      </Text>
                    )}
                    renderItem={() => null}
                    renderSectionFooter={({ section }) => (
                      <View className="px-4">
                        <FlatList
                          data={section.data}
                          numColumns={2}
                          columnWrapperStyle={{
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                          keyExtractor={(it, idx) =>
                            (it._id || it.resourceUpload) + ":" + idx
                          }
                          renderItem={({ item }) => (
                            <ResourceCard
                              item={item}
                              width={0}
                              className="w-[48%]"
                              selected={selection === item._id}
                              onPress={() => {
                                setSelection(
                                  selection === item._id
                                    ? null
                                    : item._id || null
                                );
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
              </View>
            );
          }

          if (route.key === "links") {
            return (
              <LinkList
                links={links}
                isLoading={isLinksLoading}
                onOpenLink={(link) => openSharedLink(link.url)}
                onEditLink={(link) => openLinkModal(link)}
                onDeleteLink={(link) => setLinkToDelete(link)}
              />
            );
          }

          return (
            <NoteList
              notes={notes}
              isLoading={isNotesLoading}
              onEditNote={(note) => openNoteModal(note)}
              onDeleteNote={(note) => setNoteToDelete(note)}
            />
          );
        }}
      />

      {/* Floating button only on resources */}
      {activeTab === "resources" && (
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
      )}

      {/* Keep chooser + modals exactly as you already have */}
      {activeTab === "resources" && (
        <UploadChooser
          visible={chooser}
          onClose={() => setChooser(false)}
          onPickImage={handlePickImage}
          onPickDocument={handlePickDocument}
        />
      )}

      <Modal
        visible={linkModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeLinkModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          className="flex-1 justify-end"
        >
          <Pressable
            className="absolute inset-0 bg-black/30"
            onPress={() => !linkSubmitting && closeLinkModal()}
          />
          <View className="bg-white rounded-t-2xl p-5">
            <Text className="font-kumbhBold text-lg mb-3">
              {editingLink ? "Edit link" : "Add a link"}
            </Text>

            <Text className="font-kumbh text-xs text-gray-500 mb-1">
              Title (optional)
            </Text>
            <View className="border border-gray-200 rounded-xl px-3 py-2 mb-3">
              <TextInput
                placeholder="e.g. Project brief"
                value={linkForm.title}
                onChangeText={(value) =>
                  setLinkForm((prev) => ({ ...prev, title: value }))
                }
                className="font-kumbh text-gray-900"
                editable={!linkSubmitting}
              />
            </View>

            <Text className="font-kumbh text-xs text-gray-500 mb-1">URL</Text>
            <View className="border border-gray-200 rounded-xl px-3 py-2 mb-3">
              <TextInput
                placeholder="https://example.com"
                value={linkForm.url}
                onChangeText={(value) =>
                  setLinkForm((prev) => ({ ...prev, url: value }))
                }
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                className="font-kumbh text-gray-900"
                editable={!linkSubmitting}
              />
            </View>

            <Text className="font-kumbh text-xs text-gray-500 mb-1">
              Description (optional)
            </Text>
            <View className="border border-gray-200 rounded-xl px-3 py-2">
              <TextInput
                placeholder="Add extra context"
                value={linkForm.description}
                onChangeText={(value) =>
                  setLinkForm((prev) => ({ ...prev, description: value }))
                }
                multiline
                numberOfLines={3}
                className="font-kumbh text-gray-900"
                editable={!linkSubmitting}
              />
            </View>

            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={closeLinkModal}
                disabled={linkSubmitting}
                className="px-4 py-2 rounded-xl bg-gray-100"
              >
                <Text className="font-kumbh text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveLink}
                disabled={linkSubmitting}
                className="px-4 py-2 rounded-xl bg-[#4C5FAB]"
              >
                {linkSubmitting ? (
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

      <Modal
        visible={noteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeNoteModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          className="flex-1 justify-end"
        >
          <Pressable
            className="absolute inset-0 bg-black/30"
            onPress={() => !noteSubmitting && closeNoteModal()}
          />
          <View className="bg-white rounded-t-2xl p-5">
            <Text className="font-kumbhBold text-lg mb-3">
              {editingNote ? "Edit note" : "Add a note"}
            </Text>

            <Text className="font-kumbh text-xs text-gray-500 mb-1">Title</Text>
            <View className="border border-gray-200 rounded-xl px-3 py-2 mb-3">
              <TextInput
                placeholder="Note title"
                value={noteForm.title}
                onChangeText={(value) =>
                  setNoteForm((prev) => ({ ...prev, title: value }))
                }
                className="font-kumbh text-gray-900"
                editable={!noteSubmitting}
              />
            </View>

            <Text className="font-kumbh text-xs text-gray-500 mb-1">
              Description
            </Text>
            <View className="border border-gray-200 rounded-xl px-3 py-2">
              <TextInput
                placeholder="Write your note here"
                value={noteForm.description}
                onChangeText={(value) =>
                  setNoteForm((prev) => ({ ...prev, description: value }))
                }
                multiline
                numberOfLines={4}
                className="font-kumbh text-gray-900"
                editable={!noteSubmitting}
                style={{ minHeight: 140, textAlignVertical: "top" }}
              />
            </View>

            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={closeNoteModal}
                disabled={noteSubmitting}
                className="px-4 py-2 rounded-xl bg-gray-100"
              >
                <Text className="font-kumbh text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveNote}
                disabled={noteSubmitting}
                className="px-4 py-2 rounded-xl bg-[#4C5FAB]"
              >
                {noteSubmitting ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" />
                    <Text className="text-white font-kumbh ml-2">Saving…</Text>
                  </View>
                ) : (
                  <Text className="text-white font-kumbhBold">Save note</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={Boolean(linkToDelete)}
        title="Delete link"
        message="This will remove the saved link permanently."
        onCancel={() => setLinkToDelete(null)}
        onConfirm={handleDeleteLink}
      />

      <ConfirmModal
        visible={Boolean(noteToDelete)}
        title="Delete note"
        message="Notes cannot be restored once deleted."
        onCancel={() => setNoteToDelete(null)}
        onConfirm={handleDeleteNote}
      />

      {activeTab === "resources" && actionFor ? (
        <View className="absolute inset-0 bg-black/30">
          <View className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl p-4">
            <Text className="font-kumbhBold text-base mb-2">
              Resource options
            </Text>
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
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 bottom-[90px] items-center"
        >
          <View className="bg-gray-900 px-4 py-2.5 rounded-xl flex-row items-center">
            <ActivityIndicator color="#fff" />
            <Text className="text-white ml-2 font-kumbh">
              Uploading… {upload.progress}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
